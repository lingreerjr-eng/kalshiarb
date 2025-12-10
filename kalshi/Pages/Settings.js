import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, Webhook, Bot, Key, Server } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner or similar is available, if not I'll just use alert for now or implement a simple toast

export default function Settings() {
  const handleSave = () => {
    // In a real app this would save to user preferences or backend
    alert("Configuration saved successfully");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Configuration</h1>
        <p className="text-gray-400">Manage connections, keys, and agent parameters.</p>
      </div>

      <div className="space-y-6">
        {/* LLM Config */}
        <Card className="bg-[#111214] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5 text-blue-500" />
              LLM Backend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ollama-url" className="text-gray-300">Ollama API URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="ollama-url" 
                  placeholder="http://localhost:11434" 
                  className="bg-[#0a0a0c] border-gray-700 text-white font-mono"
                  defaultValue="http://host.docker.internal:11434"
                />
                <Button variant="outline" className="border-gray-700 text-gray-300">Test</Button>
              </div>
              <p className="text-xs text-gray-500">
                The endpoint where your local or hosted Ollama instance is running. 
                Ensure CORS is enabled if accessing from browser.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="model-name" className="text-gray-300">Model Name</Label>
              <Input 
                id="model-name" 
                placeholder="llama3" 
                className="bg-[#0a0a0c] border-gray-700 text-white font-mono"
                defaultValue="llama3:latest"
              />
            </div>
          </CardContent>
        </Card>

        {/* Discord Integration */}
        <Card className="bg-[#111214] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Webhook className="w-5 h-5 text-indigo-500" />
              Discord Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="webhook" className="text-gray-300">Webhook URL</Label>
              <Input 
                id="webhook" 
                type="password"
                placeholder="https://discord.com/api/webhooks/..." 
                className="bg-[#0a0a0c] border-gray-700 text-white font-mono"
              />
              <p className="text-xs text-gray-500">
                Used to post research reports and arbitrage alerts to your server.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-[#111214] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Key className="w-5 h-5 text-yellow-500" />
              Market Data APIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="kalshi-key" className="text-gray-300">Kalshi API Key</Label>
              <Input 
                id="kalshi-key" 
                type="password" 
                className="bg-[#0a0a0c] border-gray-700 text-white font-mono"
                value="sk_live_........................"
                readOnly
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
            <Save className="w-4 h-4 mr-2" /> Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}