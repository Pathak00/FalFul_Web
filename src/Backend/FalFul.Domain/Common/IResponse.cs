using System;
using System.Collections.Generic;
using System.Text;

namespace FalFul.Domain.Common
{
    public interface IResponse
    {

        public bool IsSuccess { get; set; }


        public string Message { get; set; }

        string  Datas { get; set; }
    }


    public interface IResponse<out T> : IResponse
        {
        T Data { get; }
        }
}
