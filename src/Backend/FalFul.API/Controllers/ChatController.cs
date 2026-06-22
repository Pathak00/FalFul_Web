using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers
{

    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chat;

        public ChatController(IChatService chat)
        {
            _chat = chat;
        }

        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest("Message is required");

            var sessionId = string.IsNullOrWhiteSpace(request.SessionId)
                ? Guid.NewGuid().ToString("N")
                : request.SessionId;

            var response = await _chat.ChatAsync(sessionId, request.Message, ct);

            return Ok(new { sessionId, response });
        }

        public record ChatRequest(string Message, string? SessionId);
    }
}
