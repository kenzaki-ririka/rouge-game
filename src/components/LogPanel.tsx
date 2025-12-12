// src/components/LogPanel.tsx - 冒险日志面板

import React, { useEffect, useRef } from 'react';
import { LogEntry, LogType } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const getLogClassName = (type: LogType): string => {
  const classMap: Record<LogType, string> = {
    player: 'log-player',
    enemy: 'log-enemy',
    system: 'log-system',
    item: 'log-item',
    skill: 'log-skill',
  };
  return classMap[type] || 'log-system';
};

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 新日志自动滚动到顶部（因为新日志在最上面）
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length]);
  
  return (
    <div className="log-panel panel">
      <h2 className="panel-title">冒险日志</h2>
      <div className="log-messages" ref={scrollRef}>
        {logs.map(log => (
          <div 
            key={log.id} 
            className={`log-entry ${getLogClassName(log.type)}`}
          >
            &gt; {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};
