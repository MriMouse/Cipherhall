import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import ChatRoom from '../views/ChatRoom.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/:room',
      name: 'chatroom',
      component: ChatRoom,
      props: route => ({ 
        roomName: route.params.room 
      })
    }
  ]
})

export default router
