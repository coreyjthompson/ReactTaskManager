using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReactTaskManager.Api.Models;

namespace ReactTaskManager.Api.Data
{
    public class TodoContext : IdentityDbContext<AppUser>
    {
        public TodoContext(DbContextOptions<TodoContext> options) : base(options) { }

        public DbSet<TaskItem> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder); // important for Identity tables
        }
    }
}
