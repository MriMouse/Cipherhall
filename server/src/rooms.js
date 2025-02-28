class RoomManager {
  constructor() {
    // 聊天室数据结构
    // { roomId: { users: Map<userId, userObject> } }
    this.rooms = new Map();
    console.log('聊天室管理器已初始化');
  }
  
  // 创建新房间
  createRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { users: new Map() });
      console.log(`创建新聊天室: ${roomId}`);
    }
    return this.rooms.get(roomId);
  }
  
  // 添加用户到聊天室
  addUserToRoom(roomId, user) {
    // 确保聊天室存在
    if (!this.rooms.has(roomId)) {
      this.createRoom(roomId);
    }
    
    const room = this.rooms.get(roomId);
    room.users.set(user.id, user);
    
    console.log(`用户 ${user.name} (${user.id}) 加入聊天室 ${roomId}`);
    console.log(`聊天室 ${roomId} 现有 ${room.users.size} 名用户`);
    
    return user;
  }
  
  // 从聊天室移除用户
  removeUserFromRoom(roomId, userId) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const result = room.users.delete(userId);
      
      console.log(`用户 ${userId} ${result ? '已从聊天室移除' : '不存在于聊天室'} ${roomId}`);
      console.log(`聊天室 ${roomId} 现有 ${room.users.size} 名用户`);
      
      return result;
    }
    return false;
  }
  
  // 获取聊天室内所有用户
  getRoomUsers(roomId) {
    if (this.rooms.has(roomId)) {
      return Array.from(this.rooms.get(roomId).users.values());
    }
    return [];
  }
  
  // 获取指定用户
  getUser(roomId, userId) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      if (room.users.has(userId)) {
        return room.users.get(userId);
      }
    }
    return null;
  }
  
  // 更新用户公钥
  updateUserPublicKey(roomId, userId, publicKey) {
    const user = this.getUser(roomId, userId);
    if (user) {
      user.publicKey = publicKey;
      return true;
    }
    return false;
  }
  
  // 检查聊天室是否为空
  isRoomEmpty(roomId) {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId).users.size === 0;
    }
    return true;
  }
  
  // 删除聊天室
  removeRoom(roomId) {
    return this.rooms.delete(roomId);
  }
  
  // 获取所有聊天室信息
  getAllRoomsInfo() {
    const roomsInfo = [];
    
    this.rooms.forEach((room, roomId) => {
      roomsInfo.push({
        id: roomId,
        userCount: room.users.size
      });
    });
    
    return roomsInfo;
  }
}

module.exports = RoomManager;
