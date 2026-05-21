import apiClient from './client';

export const getTopEvents = (query: string) => 
    apiClient.get(`/events/top${query}`);

export const getEventMapData = (eventUri: string) => 
    apiClient.get(`/events/${eventUri}/map-data`);

export const getCountryDetail = (eventUri: string, countryCode: string) => 
    apiClient.get(`/events/${eventUri}/countries/${countryCode.toLowerCase()}`);

export const getArticleList = (eventUri: string, countryCode: string) => 
    apiClient.get(`/events/${eventUri}/countries/${countryCode.toLowerCase()}/articles`);