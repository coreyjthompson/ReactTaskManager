using System.Threading.Tasks;

namespace ReactTaskManager.Api.Services
{
    public interface IEmailSender
    {
        Task SendAsync(string to, string subject, string htmlBody);
    }
}


