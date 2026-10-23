import Vue from 'vue'
import VueRouter from 'vue-router'
import TaskManager from '../pages/TaskManager.vue'
import TaskDetail from '../pages/TaskDetail.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  routes: [
    { path: '/', name: 'task-manager', component: TaskManager, meta: { title: '任务管理' } },
    { path: '/tasks/:id', name: 'task-detail', component: TaskDetail, props: true, meta: { title: '任务详情' } },
    { path: '*', redirect: '/' }
  ]
})

export default router
