'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  Bell, 
  Database,
  Globe,
  Key,
  Mail,
  CreditCard,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-slate-400 text-sm">Configure platform settings and integrations</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-400" />
              General Settings
            </CardTitle>
            <CardDescription className="text-slate-400">Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Platform Name</label>
              <Input defaultValue="MAESTRO" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Support Email</label>
              <Input defaultValue="support@maestro.ae" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Default Currency</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                <option>AED - UAE Dirham</option>
                <option>USD - US Dollar</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Maintenance Mode</p>
                <p className="text-xs text-slate-400">Disable user access temporarily</p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400">
                <ToggleLeft className="w-8 h-8" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Security Settings
            </CardTitle>
            <CardDescription className="text-slate-400">Authentication and security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Two-Factor Authentication</p>
                <p className="text-xs text-slate-400">Require 2FA for all admin users</p>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-400">
                <ToggleRight className="w-8 h-8" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Session Timeout</p>
                <p className="text-xs text-slate-400">Auto logout after inactivity</p>
              </div>
              <select className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">IP Whitelist</p>
                <p className="text-xs text-slate-400">Restrict admin access by IP</p>
              </div>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                Configure
              </Button>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Password Policy</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                <option>Standard (8+ chars, mixed case)</option>
                <option>Strong (12+ chars, symbols required)</option>
                <option>Enterprise (16+ chars, all requirements)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Notification Settings
            </CardTitle>
            <CardDescription className="text-slate-400">System notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Email Notifications</p>
                <p className="text-xs text-slate-400">Send email alerts for important events</p>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-400">
                <ToggleRight className="w-8 h-8" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">SMS Notifications</p>
                <p className="text-xs text-slate-400">Send SMS for critical alerts</p>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-400">
                <ToggleRight className="w-8 h-8" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Slack Integration</p>
                <p className="text-xs text-slate-400">Post alerts to Slack channel</p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400">
                <ToggleLeft className="w-8 h-8" />
              </Button>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Alert Email Recipients</label>
              <Input 
                placeholder="admin@maestro.ae, ops@maestro.ae" 
                className="bg-slate-700 border-slate-600 text-white" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-400" />
              Payment Settings
            </CardTitle>
            <CardDescription className="text-slate-400">Payment gateway configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Auto-refund Failed Payments</p>
                <p className="text-xs text-slate-400">Automatically refund on failure</p>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-400">
                <ToggleRight className="w-8 h-8" />
              </Button>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Transaction Fee (%)</label>
              <Input defaultValue="2.5" type="number" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Minimum Wallet Top-up (AED)</label>
              <Input defaultValue="50" type="number" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Maximum Wallet Balance (AED)</label>
              <Input defaultValue="100000" type="number" className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              API Keys & Integrations
            </CardTitle>
            <CardDescription className="text-slate-400">Manage API keys and third-party integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'RAKBANK API', key: 'rk_live_****', status: 'active' },
                { name: 'Mashreq Bank API', key: 'mq_live_****', status: 'active' },
                { name: 'Wio Bank API', key: 'wio_live_****', status: 'active' },
                { name: 'Emirates NBD API', key: 'enbd_test_****', status: 'sandbox' },
                { name: 'Binance API', key: 'bn_testnet_****', status: 'testnet' },
                { name: 'Rain Exchange API', key: 'rain_****', status: 'inactive' },
              ].map((api) => (
                <div key={api.name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-white font-medium">{api.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{api.key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      api.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      api.status === 'sandbox' ? 'bg-yellow-500/20 text-yellow-400' :
                      api.status === 'testnet' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {api.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
