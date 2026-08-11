namespace FalFul.Domain.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? Error { get; private set; }

    public string Message { get; private set; } = string.Empty;
    public List<string> Errors { get; private set; } = [];

    public static Result<T> Success(T data,string message) => new() { IsSuccess = true,Message=message, Data = data };
    public static Result<T> Failure(string error) => new() { IsSuccess = false, Error = error };
    public static Result<T> Failure(List<string> errors) => new() { IsSuccess = false, Errors = errors, Error = errors.FirstOrDefault() };
}

public class Result
{
    public bool IsSuccess { get; private set; }
    public string? Error { get; private set; }
    public List<string> Errors { get; private set; } = [];

    public string Message { get; private set; } = string.Empty;

    public static Result Success(string message) => new() { IsSuccess = true, Message=message };
    public static Result Failure(string error) => new() { IsSuccess = false, Error = error };
    public static Result Failure(List<string> errors) => new() { IsSuccess = false, Errors = errors, Error = errors.FirstOrDefault() };
}
