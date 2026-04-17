<template>
  <a-dropdown>
    <a-space class="user-info" :class="{ 'user-info-compact': compact }">
      <a-avatar :style="{ backgroundColor: getAvatarColor() }">
        <template #icon><UserOutlined /></template>
      </a-avatar>
      <span v-if="!compact" class="username">{{ currentUser.displayName }}</span>
      <a-tag v-if="showRole" :color="getRoleColor()" class="role-tag">
        {{ currentRoleLabel }}
      </a-tag>
    </a-space>
    <template #overlay>
      <a-menu>
        <a-menu-item-group title="切换用户">
          <a-menu-item
            v-for="user in MOCK_USERS"
            :key="user.id"
            :class="{ 'ant-dropdown-menu-item-selected': user.id === currentUser.id }"
            @click="handleSwitchUser(user)"
          >
            <a-space>
              <UserOutlined />
              <span>{{ user.displayName }}</span>
              <a-tag size="small" :color="getRoleTagColor(user.role)">
                {{ ROLE_LABELS[user.role] }}
              </a-tag>
            </a-space>
          </a-menu-item>
        </a-menu-item-group>
        <a-menu-divider />
        <a-menu-item @click="handleCopyAuthHeader">
          <CopyOutlined /> 复制认证信息
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import { UserOutlined, CopyOutlined } from '@ant-design/icons-vue'
import { useDevUserStore, MOCK_USERS, ROLE_LABELS, type DevUser, type UserRole } from '@/stores/devUser'

interface Props {
  compact?: boolean
  showRole?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false,
  showRole: true,
})

const devUserStore = useDevUserStore()

const currentUser = computed(() => devUserStore.currentUser)
const currentRoleLabel = computed(() => devUserStore.currentRoleLabel)

// 根据用户名生成头像颜色
const getAvatarColor = () => {
  const colors = ['#1677ff', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#EB2F96']
  const index = parseInt(currentUser.value.id) % colors.length
  return colors[index]
}

// 根据角色获取标签颜色
const getRoleColor = () => {
  const colorMap: Record<UserRole, string> = {
    W_RBCC_AEP_WFAM_Customer_Quality_ENG: 'blue',
    W_RBCC_AEP_WFAM_Analyst: 'cyan',
    W_RBCC_AEP_WFAM_QMC_Leader: 'orange',
    W_RBCC_AEP_WFAM_QMC_Manager: 'purple',
    R_RBCC_AEP_WFAM_Visitor: 'default',
    W_RBCC_AEP_WFAM_SystemAdmin: 'red',
  }
  return colorMap[currentUser.value.role]
}

// 获取角色标签颜色（用于下拉菜单）
const getRoleTagColor = (role: UserRole) => {
  const colorMap: Record<UserRole, string> = {
    W_RBCC_AEP_WFAM_Customer_Quality_ENG: 'blue',
    W_RBCC_AEP_WFAM_Analyst: 'cyan',
    W_RBCC_AEP_WFAM_QMC_Leader: 'orange',
    W_RBCC_AEP_WFAM_QMC_Manager: 'purple',
    R_RBCC_AEP_WFAM_Visitor: 'default',
    W_RBCC_AEP_WFAM_SystemAdmin: 'red',
  }
  return colorMap[role]
}

// 切换用户
const handleSwitchUser = (user: DevUser) => {
  devUserStore.setUser(user)
  message.success(`已切换到用户: ${user.displayName} (${ROLE_LABELS[user.role]})`)
  // 刷新页面以应用新的用户信息
  setTimeout(() => {
    window.location.reload()
  }, 500)
}

// 复制认证信息（用于调试）
const handleCopyAuthHeader = () => {
  const header = devUserStore.authHeader
  const text = `x-authentication-header:\n${header}`
  navigator.clipboard.writeText(text).then(() => {
    message.success('认证信息已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}
</script>

<style lang="less" scoped>
.user-info {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .username {
    color: #333;
  }

  .role-tag {
    margin-left: 4px;
  }
}

.user-info-compact {
  .username {
    display: none;
  }
}
</style>
