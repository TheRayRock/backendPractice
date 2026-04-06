class ApiReponse {
  constructor(statusCode, message = "success", data) {
    this.statusCode = statusCode < 400 ? statusCode : 200;
    this.message = message;
    this.data = data;
    this.success = true;
  }
}
export default ApiReponse;
