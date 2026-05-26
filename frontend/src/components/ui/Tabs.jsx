import React from 'react';

export const Tabs = ({ tabs, activeTab, onTabChange, variant = 'nav', className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={(e) => { e.preventDefault(); onTabChange(tab.id); }}
          className={
            variant === 'nav'
              ? `nav-link ${activeTab === tab.id ? 'active' : ''}`
              : `btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
