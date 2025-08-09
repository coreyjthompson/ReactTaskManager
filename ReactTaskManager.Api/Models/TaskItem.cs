using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using ReactTaskManager.Api.Data;
namespace ReactTaskManager.Api.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "To Do";
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedUtc { get; set; }
        public int SortOrder { get; set; }
    }


    public static class TaskItemEndpoints
    {
        public static void MapTaskItemEndpoints(this IEndpointRouteBuilder routes)
        {
            var group = routes.MapGroup("/api/TaskItem").WithTags(nameof(TaskItem));

            group.MapGet("/", async (TodoContext db) =>
            {
                return await db.Tasks.ToListAsync();
            })
            .WithName("GetAllTaskItems")
            .WithOpenApi();

            group.MapGet("/{id}", async Task<Results<Ok<TaskItem>, NotFound>> (int id, TodoContext db) =>
            {
                return await db.Tasks.AsNoTracking()
                    .FirstOrDefaultAsync(model => model.Id == id)
                    is TaskItem model
                        ? TypedResults.Ok(model)
                        : TypedResults.NotFound();
            })
            .WithName("GetTaskItemById")
            .WithOpenApi();

            group.MapPut("/{id}", async Task<Results<Ok, NotFound>> (int id, TaskItem taskItem, TodoContext db) =>
            {
                var affected = await db.Tasks
                    .Where(model => model.Id == id)
                    .ExecuteUpdateAsync(setters => setters
                      .SetProperty(m => m.Id, taskItem.Id)
                      .SetProperty(m => m.Title, taskItem.Title)
                      .SetProperty(m => m.Description, taskItem.Description)
                      .SetProperty(m => m.DueDate, taskItem.DueDate)
                      .SetProperty(m => m.Status, taskItem.Status)
                      );
                return affected == 1 ? TypedResults.Ok() : TypedResults.NotFound();
            })
            .WithName("UpdateTaskItem")
            .WithOpenApi();

            group.MapPost("/", async (TaskItem taskItem, TodoContext db) =>
            {
                db.Tasks.Add(taskItem);
                await db.SaveChangesAsync();
                return TypedResults.Created($"/api/TaskItem/{taskItem.Id}", taskItem);
            })
            .WithName("CreateTaskItem")
            .WithOpenApi();

            group.MapDelete("/{id}", async Task<Results<Ok, NotFound>> (int id, TodoContext db) =>
            {
                var affected = await db.Tasks
                    .Where(model => model.Id == id)
                    .ExecuteDeleteAsync();
                return affected == 1 ? TypedResults.Ok() : TypedResults.NotFound();
            })
            .WithName("DeleteTaskItem")
            .WithOpenApi();
        }
    }
}
