using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IDeliveryIssueRepository
{
    Task<int> CreateAsync(DeliveryIssue issue);
    Task ResolveAsync(int id, string? resolutionNotes);
}
