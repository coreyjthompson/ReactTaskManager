using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactTaskManager.Api.Data;
using ReactTaskManager.Api.Models;

namespace ReactTaskManager.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly TodoContext _context;

        public TasksController(TodoContext context)
        {
            _context = context;
        }

        // GET: api/tasks
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks([FromQuery] string? status, [FromQuery] string? keywords, [FromQuery] DateTime? dueFrom,
            [FromQuery] DateTime? dueTo, [FromQuery] string? sortBy = "created", [FromQuery] string? sortDir = "asc", [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            if (page < 1)
            {
                page = 1;
            }

            if (pageSize < 1 || pageSize > 100)
            {
                pageSize = 20;
            }

            IQueryable<TaskItem> query = _context.Tasks.AsNoTracking();

            // Filters
            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(t => t.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(keywords))
            {
                query = query.Where(t =>
                  t.Title.Contains(keywords) || (t.Description != null && t.Description.Contains(keywords)));
            }

            if (dueFrom.HasValue)
            {
                query = query.Where(t => t.DueDate >= dueFrom.Value);
            }

            if (dueTo.HasValue)
            {
                query = query.Where(t => t.DueDate <= dueTo.Value);
            }

            // Sorting
            bool desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
            query = sortBy?.ToLowerInvariant() switch
            {
                "due" => desc ? query.OrderByDescending(t => t.DueDate).ThenBy(t => t.Id)
                                 : query.OrderBy(t => t.DueDate).ThenBy(t => t.Id),
                "title" => desc ? query.OrderByDescending(t => t.Title).ThenBy(t => t.Id)
                                 : query.OrderBy(t => t.Title).ThenBy(t => t.Id),
                "status" => desc ? query.OrderByDescending(t => t.Status).ThenBy(t => t.Id)
                                 : query.OrderBy(t => t.Status).ThenBy(t => t.Id),
                _ => desc ? query.OrderByDescending(t => t.CreatedUtc).ThenBy(t => t.Id)
                                 : query.OrderBy(t => t.CreatedUtc).ThenBy(t => t.Id)
            };

            // Pagination
            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            // Optional total count header for paging
            Response.Headers["X-Total-Count"] = total.ToString();

            return Ok(items);
        }
        // GET: api/tasks/5
        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);

            if (task == null)
            {
                return NotFound();
            }

            return Ok(task);
        }

        // POST: api/tasks
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<TaskItem>> CreateTask(TaskItem task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Returns 201 with a Location header
            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }

        // PUT: api/tasks/5
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTask(int id, TaskItem updatedTask)
        {
            if (id != updatedTask.Id)
            {
                return BadRequest();
            }

            updatedTask.UpdatedUtc = DateTime.UtcNow;

            _context.Entry(updatedTask).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Tasks.AnyAsync(t => t.Id == id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        // DELETE: api/tasks/5
        [Authorize]
        [HttpDelete("{id:int}")]
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
    }
}
