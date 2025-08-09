using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ReactTaskManager.Api.Models;
using ReactTaskManager.Api.Services;

namespace ReactTaskManager.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly TokenService _tokenService;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            TokenService tokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        public record RegisterRequest(string Email, string Password);
        public record LoginRequest(string Email, string Password);

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            var existing = await _userManager.FindByEmailAsync(req.Email);
            if (existing != null)
            {
                return BadRequest("Email already in use.");
            }

            var user = new AppUser { UserName = req.Email, Email = req.Email };
            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            var token = _tokenService.CreateToken(user);
            return Ok(new { token, user = new { user.Id, user.UserName, user.Email } });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _userManager.FindByEmailAsync(req.Email);
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
    }
}
