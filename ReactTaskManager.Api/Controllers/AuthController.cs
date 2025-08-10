using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ReactTaskManager.Api.Models;
using ReactTaskManager.Api.Models.Auth;
using ReactTaskManager.Api.Services;

namespace ReactTaskManager.Api.Controllers
{
    [ApiController]
    [ApiExplorerSettings(GroupName = "v1")]
    [Route("api/[controller]")]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly TokenService _tokenService;
        private readonly IConfiguration _config;
        private readonly IEmailSender _email;

        public AuthController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, TokenService tokenService, IConfiguration config, IEmailSender email)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _config = config;
            _email = email;
        }

        // Lightweight DTOs for login/register
        public record RegisterRequest(string Email, string Password);
        public record LoginRequest(string Email, string Password);

        /// <summary>
        /// Registers a new user.
        /// </summary>
        /// <param name="req">Register request</param>
        /// <returns>JWT token and user info</returns>
        // POST: /api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest("Email and password are required.");
            }

            var email = req.Email.Trim().ToLowerInvariant();

            var existing = await _userManager.FindByEmailAsync(email);
            if (existing != null)
            {
                return BadRequest("Email already in use.");
            }

            var user = new AppUser { UserName = email, Email = email };
            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Return a token (frontend can ignore if you prefer manual login)
            var token = _tokenService.CreateToken(user);
            return Ok(new { token, user = new { user.Id, user.UserName, user.Email } });
        }

        /// <summary>
        /// Logs in a user.
        /// </summary>
        /// <param name="req">Login request</param>
        /// <returns>JWT token and user info</returns>
        // POST: /api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return Unauthorized("Invalid credentials.");
            }

            var email = req.Email.Trim().ToLowerInvariant();
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            var check = await _signInManager.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: false);
            if (!check.Succeeded)
            {
                return Unauthorized("Invalid credentials.");
            }

            var token = _tokenService.CreateToken(user);
            return Ok(new { token, user = new { user.Id, user.UserName, user.Email } });
        }

        /// <summary>
        /// Sends a password reset email.
        /// </summary>
        /// <param name="req">Forgot password request</param>
        // POST: /api/auth/forgot-password
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email))
            {
                return NoContent();
            }

            var email = req.Email.Trim().ToLowerInvariant();
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NoContent();
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // TODO: log an error and skip the email if the config setting is null or empty;
            // Frontend URL base configured in appsettings, e.g. "http://localhost:3000/reset-password"
            var urlBase = _config["Frontend:ResetPasswordUrl"]?.TrimEnd('/') ?? "http://localhost:3000/reset-password";
            var link = $"{urlBase}?email={WebUtility.UrlEncode(user.Email!)}&token={WebUtility.UrlEncode(token)}";

            await _email.SendAsync(user.Email!, "Reset your password",
                $@"<p>Click the link to reset your password (valid for ~2 hours):</p>
                   <p><a href=""{link}"">{link}</a></p>");

            return NoContent();
        }

        /// <summary>
        /// Resets a user's password.
        /// </summary>
        /// <param name="req">Reset password request</param>
        // POST: /api/auth/reset-password
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) ||
                string.IsNullOrWhiteSpace(req.Token) ||
                string.IsNullOrWhiteSpace(req.NewPassword))
            {
                return BadRequest("Missing fields.");
            }

            var email = req.Email.Trim().ToLowerInvariant();
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NoContent(); // avoid enumeration
            }

            // IMPORTANT: decode the token you previously URL-encoded
            var decodedToken = WebUtility.UrlDecode(req.Token);

            var result = await _userManager.ResetPasswordAsync(user, decodedToken, req.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            return NoContent();
        }

        /// <summary>
        /// Gets the current user's profile.
        /// </summary>
        /// <returns>User info</returns>
        // (Optional) GET: /api/auth/me — quick way for the client to validate token and fetch basic profile
        [HttpGet("me")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Me()
        {
            var userId = User?.Claims?.FirstOrDefault(c => c.Type == "sub")?.Value
                         ?? User?.Claims?.FirstOrDefault(c => c.Type == "nameid")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(new { user = new { user.Id, user.UserName, user.Email } });
        }
    }
}
