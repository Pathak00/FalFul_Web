namespace FalFul.Application.Interfaces
{
    public interface IFruitInfoSearchService
    {
        Task<string?> GetSummaryAsync(string fruitName, CancellationToken ct = default);
    }
}
