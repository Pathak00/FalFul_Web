using FalFul.Application.Interfaces;
using Microsoft.SemanticKernel;
using System.ComponentModel;

namespace FalFul.ChatAI.Plugins;

public class FruitInfoPlugin(IFruitInfoSearchService fruitInfo)
{
    [KernelFunction("get_fruit_info")]
    [Description("""Fetches nutrition and health facts about ONE specific fruit. Requires arguments: { "fruitName": "<name>" }.""")]
    public async Task<string> GetFruitInfoAsync(
        [Description("The name of the fruit to get nutritional information about")] string fruitName,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fruitName))
            return "No fruit name was provided.";

        var summary = await fruitInfo.GetSummaryAsync(fruitName, cancellationToken);
        return summary ?? $"No information found for {fruitName}.";
    }
}
