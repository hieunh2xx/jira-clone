namespace ManagementProject.DTO
{
    public class ResponeSuccess<T>
    {
        public int Code { get; set; }
        public string Message { get; set; }
        public T? Data { get; set; }
        public ResponeSuccess() { }
        public ResponeSuccess(int code, string message, T? data = default)
        {
            Code = code;
            Message = message;
            Data = data;
        }
    }
}