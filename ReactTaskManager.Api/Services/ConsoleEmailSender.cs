namespace ReactTaskManager.Api.Services
{
    public class ConsoleEmailSender : IEmailSender
    {
        private readonly ILogger<ConsoleEmailSender> _logger;
        public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger) => _logger = logger;

        public Task SendAsync(string to, string subject, string htmlBody)
        {
            _logger.LogInformation("DEV EMAIL to {To}\nSUBJECT: {Subject}\nBODY:\n{Body}", to, subject, htmlBody);
            return Task.CompletedTask;
        }
    }

}
