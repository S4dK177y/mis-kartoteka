import React, { useState } from 'react';
import { Shield, Users, Lock, Activity, Save } from 'lucide-react';
import { UsersTab } from './admin/UsersTab';
import { SecurityTab } from './admin/SecurityTab';
import { LogsTab } from './admin/LogsTab';
import { BackupsTab } from './admin/BackupsTab';
import { Tabs } from '../components/ui';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: <span className="flex items-center gap-2"><Users size={16} /> Пользователи</span> },
    { id: 'security', label: <span className="flex items-center gap-2"><Lock size={16} /> Безопасность</span> },
    { id: 'logs', label: <span className="flex items-center gap-2"><Activity size={16} /> Журнал аудита</span> },
    { id: 'backups', label: <span className="flex items-center gap-2"><Save size={16} /> Бэкапы</span> }
  ];

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield size={28} className="text-primary" />
        <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--primary)' }}>Панель администратора</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2" style={{ overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="button" />
      </div>

      {/* Content */}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'logs' && <LogsTab />}
      {activeTab === 'backups' && <BackupsTab />}
    </div>
  );
};

export default AdminPanel;
