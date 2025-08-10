using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactTaskManager.Api.Data;
using ReactTaskManager.Api.Models;

namespace ReactTaskManager.Api.Controllers
{
    [Authorize]
    [ApiController]
    [ApiExplorerSettings(GroupName = "v1")]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private static readonly HashSet<string> ValidStatuses =
            new(new[] { "To Do", "In Progress", "Done" }, StringComparer.OrdinalIgnoreCase);

        private readonly TodoContext _context;

        public TasksController(TodoContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Returns tasks for the current user with optional filters.
        /// </summary>
        /// <param name="status">Status filter (To Do, In Progress, Done)</param>
        /// <param name="keywords">Keyword search for title/description</param>
        /// <param name="dueFrom">Due date from</param>
        /// <param name="dueTo">Due date to</param>
        /// <param name="sortBy">Sort by field</param>
        /// <param name="sortDir">Sort direction</param>
        /// <param name="page">Page number</param>
        /// <param name="pageSize">Page size</param>
        /// <returns>List of tasks</returns>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<TaskItem>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks(
            [FromQuery] string? status,
            [FromQuery] string? keywords,
            [FromQuery] DateTime? dueFrom,
            [FromQuery] DateTime? dueTo,
            [FromQuery] string? sortBy = "created",
            [FromQuery] string? sortDir = "asc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            // Clamp paging
            page = Math.Max(page, 1);
            pageSize = (pageSize < 1 || pageSize > 100) ? 20 : pageSize;

            IQueryable<TaskItem> query = _context.Tasks.AsNoTracking();

            // STATUS (case-insensitive, ignore "All")
            if (!string.IsNullOrWhiteSpace(status) &&
                !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => t.Status != null && t.Status.ToLower() == status.ToLower());
            }

            // KEYWORDS (case-insensitive LIKE for title/description)
            if (!string.IsNullOrWhiteSpace(keywords))
            {
                // Escape % and _ for LIKE
                string escaped = Regex.Replace(keywords.Trim(), @"([%_])", "[$1]");
                string pattern = $"%{escaped}%";

                query = query.Where(t =>
                    EF.Functions.Like(t.Title!, pattern) ||
                    (t.Description != null && EF.Functions.Like(t.Description!, pattern)));
            }

            // DATE RANGE (treat dueTo as end-of-day)
            if (dueFrom.HasValue)
            {
                var from = dueFrom.Value.Date;
                query = query.Where(t => t.DueDate >= from);
            }
            if (dueTo.HasValue)
            {
                var toExclusive = dueTo.Value.Date.AddDays(1); // < next day
                query = query.Where(t => t.DueDate < toExclusive);
            }

            // SORTING
            bool desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
            switch ((sortBy ?? "created").ToLowerInvariant())
            {
                case "sortorder":
                    // If a single status is selected, just sort by SortOrder within that column.
                    // If "All", keep results stable by status then SortOrder.
                    if (!string.IsNullOrWhiteSpace(status) &&
                        !status.Equals("All", StringComparison.OrdinalIgnoreCase))
                    {
                        query = query.OrderBy(t => t.SortOrder).ThenBy(t => t.Id);
                    }
                    else
                    {
                        query = query.OrderBy(t => t.Status)
                                     .ThenBy(t => t.SortOrder)
                                     .ThenBy(t => t.Id);
                    }
                    break;

                case "due":
                    query = desc
                        ? query.OrderByDescending(t => t.DueDate).ThenBy(t => t.Id)
                        : query.OrderBy(t => t.DueDate).ThenBy(t => t.Id);
                    break;

                case "title":
                    query = desc
                        ? query.OrderByDescending(t => t.Title).ThenBy(t => t.Id)
                        : query.OrderBy(t => t.Title).ThenBy(t => t.Id);
                    break;

                case "status":
                    query = desc
                        ? query.OrderByDescending(t => t.Status).ThenBy(t => t.Id)
                        : query.OrderBy(t => t.Status).ThenBy(t => t.Id);
                    break;

                default: // "created"
                    query = desc
                        ? query.OrderByDescending(t => t.CreatedUtc).ThenBy(t => t.Id)
                        : query.OrderBy(t => t.CreatedUtc).ThenBy(t => t.Id);
                    break;
            }

            // PAGINATION
            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize)
                                   .Take(pageSize)
                                   .ToListAsync();
            // Testing - remove later
            //await Task.Delay(10000);


            Response.Headers["X-Total-Count"] = total.ToString();
            return Ok(items);
        }

        /// <summary>
        /// Gets a single task by ID.
        /// </summary>
        /// <param name="id">Task ID</param>
        /// <returns>Task item</returns>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(TaskItem), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var task = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
            if (task == null)
            {
                return NotFound();
            }

            return Ok(task);
        }

        /// <summary>
        /// Creates a new task.
        /// </summary>
        /// <param name="task">Task item</param>
        /// <returns>Created task</returns>
        [HttpPost]
        [ProducesResponseType(typeof(TaskItem), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<TaskItem>> CreateTask([FromBody] TaskItem task)
        {
            // Defaults
            task.CreatedUtc = DateTime.UtcNow;
            task.UpdatedUtc = DateTime.UtcNow;

            // Ensure valid status
            task.Status = string.IsNullOrWhiteSpace(task.Status) ? "To Do" : task.Status;

            // Append to bottom of the chosen column
            var maxOrder = await _context.Tasks
                .Where(t => t.Status == task.Status)
                .Select(t => (int?)t.SortOrder)
                .MaxAsync() ?? 0;

            task.SortOrder = maxOrder + 10;

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }

        /// <summary>
        /// Updates an existing task.
        /// </summary>
        /// <param name="id">Task ID</param>
        /// <param name="updated">Updated task item</param>
        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem updated)
        {
            if (id != updated.Id)
            {
                return BadRequest();
            }

            var entity = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
            if (entity == null)
            {
                return NotFound();
            }

            // Update allowed fields
            entity.Title = updated.Title;
            entity.Description = updated.Description;
            entity.DueDate = updated.DueDate;
            entity.Status = string.IsNullOrWhiteSpace(updated.Status) ? entity.Status : updated.Status;

            // If status changed, push to bottom of new column (optional: keep existing SortOrder if you prefer)
            if (!string.Equals(entity.Status, updated.Status, StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(updated.Status))
            {
                var maxOrder = await _context.Tasks
                    .Where(t => t.Status == updated.Status)
                    .Select(t => (int?)t.SortOrder)
                    .MaxAsync() ?? 0;

                entity.SortOrder = maxOrder + 10;
            }

            entity.UpdatedUtc = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Deletes a task by ID.
        /// </summary>
        /// <param name="id">Task ID</param>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Reorders tasks within columns.
        /// </summary>
        /// <param name="updates">List of column reorder updates</param>
        [HttpPatch("reorder")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderColumnDto> updates)
        {
            if (updates is null || updates.Count == 0)
            {
                return BadRequest("No updates provided.");
            }

            // Validate columns
            foreach (var col in updates)
            {
                if (string.IsNullOrWhiteSpace(col.Status) || !ValidStatuses.Contains(col.Status))
                {
                    return BadRequest($"Invalid status '{col.Status}'.");
                }
            }

            // Collect all ids to touch
            var allIds = updates.SelectMany(u => u.OrderedIds).Distinct().ToList();
            if (allIds.Count == 0)
            {
                return BadRequest("No task ids provided.");
            }

            var tasks = await _context.Tasks
                .Where(t => allIds.Contains(t.Id))
                .ToListAsync();

            // Apply each column's order
            foreach (var col in updates)
            {
                for (int i = 0; i < col.OrderedIds.Count; i++)
                {
                    var id = col.OrderedIds[i];
                    var t = tasks.FirstOrDefault(x => x.Id == id);
                    if (t is null)
                    {
                        continue;
                    }

                    t.Status = col.Status;      // move to that column
                    t.SortOrder = (i + 1) * 10; // spaced ordering
                    t.UpdatedUtc = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class ReorderColumnDto
        {
            public string Status { get; set; } = default!;
            public List<int> OrderedIds { get; set; } = new();
        }
    }
}
