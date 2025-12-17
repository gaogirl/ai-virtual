import React from 'react';
import './Teacher.css';

export default function TeacherHome() {
  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>欢迎使用教师端</span></div>
        <div style={{ lineHeight: 1.8 }}>
          <p>从上方导航进入常用功能：</p>
          <ul>
            <li>智能对话：与 AI 助手沟通备课或生成素材</li>
            <li>班级管理：创建班级、查看/重置邀请码、成员管理</li>
            <li>作业管理：按班级布置作业、查看提交</li>
            <li>数据看板：查看班级作业完成率与统计</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

