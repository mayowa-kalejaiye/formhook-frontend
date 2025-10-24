"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreHorizontal 
} from 'lucide-react';

interface Activity {
  id: string;
  form_name: string;
  form_id: string;
  email?: string;
  date: string;
  time: string;
  status: 'success' | 'failed' | 'pending';
  submission_data?: any;
}

interface RecentActivitiesProps {
  activities: Activity[];
  loading?: boolean;
}

export default function RecentActivities({ activities, loading = false }: RecentActivitiesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'pending'>('all');

  // Debug logging
  React.useEffect(() => {
    console.log('[RecentActivities] Received activities:', activities);
    console.log('[RecentActivities] Activities count:', activities?.length || 0);
  }, [activities]);

  const statusConfig = {
    success: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle2,
      label: 'Completed'
    },
    failed: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: XCircle,
      label: 'Failed'
    },
    pending: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: AlertCircle,
      label: 'Pending'
    }
  };

  const filteredActivities = React.useMemo(() => {
    if (!activities || !Array.isArray(activities)) {
      console.warn('[RecentActivities] Invalid activities data:', activities);
      return [];
    }
    
    return activities.filter((activity) => {
      if (!activity) return false;
      
      const matchesSearch = 
        (activity.form_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [activities, searchQuery, filterStatus]);

  const getActivityIcon = (formName: string) => {
    // You can customize icons based on form type
    return <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />;
  };

  return (
    <Card className="pro-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Recent Activities
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
              Detailed view of all form submissions and their status
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => {
                // Cycle through filter states
                const states: Array<'all' | 'success' | 'failed' | 'pending'> = ['all', 'success', 'failed', 'pending'];
                const currentIndex = states.indexOf(filterStatus);
                setFilterStatus(states[(currentIndex + 1) % states.length]);
              }}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-900 dark:text-slate-100 font-semibold mb-1">No activities found</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Activities will appear here once users submit your forms'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredActivities.map((activity) => {
                  const StatusIcon = statusConfig[activity.status].icon;
                  
                  return (
                    <tr 
                      key={activity.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                            {getActivityIcon(activity.form_name)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {activity.form_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                          {String(activity.id).substring(0, 12)}...
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4" />
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Clock className="h-4 w-4" />
                          {activity.time}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {activity.email || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${statusConfig[activity.status].color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[activity.status].label}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
