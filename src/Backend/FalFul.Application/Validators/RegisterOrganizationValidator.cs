using FalFul.Application.DTOs.Auth;
using FluentValidation;

namespace FalFul.Application.Validators;

public class RegisterOrganizationValidator : AbstractValidator<RegisterOrganizationDto>
{
    public RegisterOrganizationValidator()
    {
        RuleFor(x => x.OwnerFullName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.OwnerEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.OwnerPhone).NotEmpty().Matches(@"^\+?[1-9]\d{7,14}$");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.");
        RuleFor(x => x.OrganizationName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.OrganizationType).NotEmpty().MaximumLength(50);
    }
}
