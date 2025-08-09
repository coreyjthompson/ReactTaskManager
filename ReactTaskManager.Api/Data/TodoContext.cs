using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReactTaskManager.Api.Models;

namespace ReactTaskManager.Api.Data
{
    public class TodoContext : IdentityDbContext<AppUser>
    {
        public TodoContext(DbContextOptions<TodoContext> options) : base(options) { }

        public DbSet<TaskItem> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            b.Entity<TaskItem>()
                .Property(t => t.SortOrder)
                .HasDefaultValue(0);

            // Helps fast “column + order” queries
            b.Entity<TaskItem>()
                .HasIndex(t => new { t.Status, t.SortOrder });
        }
    }
}
