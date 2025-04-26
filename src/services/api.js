import axios from 'axios';

const api = axios.create({
  baseURL: 'https://my.meteoblue.com/packages/basic-day', // Substitua com a URL base real
});

export default api;