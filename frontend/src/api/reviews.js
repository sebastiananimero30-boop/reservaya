import api from './axios'

export const getReviews = (restaurantId) =>
  api.get(`/restaurants/${restaurantId}/reviews`).then(r => r.data)

export const createReview = (restaurantId, data) =>
  api.post(`/restaurants/${restaurantId}/reviews`, data).then(r => r.data)

export const deleteReview = (restaurantId) =>
  api.delete(`/restaurants/${restaurantId}/reviews`).then(r => r.data)
