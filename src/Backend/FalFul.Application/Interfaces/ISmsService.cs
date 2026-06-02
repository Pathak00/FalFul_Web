namespace FalFul.Application.Interfaces;

public interface ISmsService
{
    Task SendAsync(string toPhone, string message);
}
