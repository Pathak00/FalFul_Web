using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;


namespace FalFul.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            Console.WriteLine("================================");
            Console.WriteLine($"ConnectionId: {Context.ConnectionId}");
            Console.WriteLine($"UserIdentifier: {Context.UserIdentifier}");
            Console.WriteLine($"Authenticated: {Context.User?.Identity?.IsAuthenticated}");

            Console.WriteLine(
                $"NameIdentifier: {Context.User?.FindFirstValue(
                    ClaimTypes.NameIdentifier
                )}"
            );

            Console.WriteLine(
                $"Sub: {Context.User?.FindFirstValue("sub")}"
            );

            Console.WriteLine("================================");

            await base.OnConnectedAsync();
        }
    }
}
