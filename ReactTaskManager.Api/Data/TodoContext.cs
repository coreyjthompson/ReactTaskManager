using Microsoft.EntityFrameworkCore;
using ReactTaskManager.Api.Models;

namespace ReactTaskManager.Api.Data
{
    public class TodoContext : DbContext
    {
        public TodoContext(DbContextOptions<TodoContext> options)
          : base(options) { }

        public DbSet<TaskItem> Tasks { get; set; }
    }
}
