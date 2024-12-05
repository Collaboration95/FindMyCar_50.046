import axios from 'axios';

const baseUrl = "/api/events";

axios.interceptors.request.use(
    (config) => {
      // Log the request configuration
      console.log('Request:', config);
      return config;
    },
    (error) => {
      // Handle the request error
      return Promise.reject(error);
    }
  );

const getEvents = async () =>{
    try {
        const response = await axios.get(baseUrl);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

const getEventsByPlateNumber = async (plate_number)=>{
    try {
        const response = await axios.get(`${baseUrl}/plate/${plate_number}`);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

const filterEvents = async (filters) => {
    try{
        const query = new URLSearchParams(filters).toString();
        const response = await axios.get(`${baseUrl}/filter?${query}`);
        return response.data;
    }
    catch(error){
        console.error(error);
    }


   
};

export default {getEvents, getEventsByPlateNumber,filterEvents};