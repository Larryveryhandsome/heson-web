import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const serviceTypes = [
  '居家清潔', '家電清洗', '整理收納', '商業清潔', '布面清洗', '裝潢後清潔'
];

export default function ServiceCaseManager() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_type: '',
    location: '',
    client_story: '',
    cleaner_notes: '',
    tags: '',
    featured: false,
    status: 'draft'
  });

  const [uploadedPhotos, setUploadedPhotos] = useState({
    before: [],
    after: []
  });

  React.useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        if (userData?.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(userData);
      } else {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, []);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['serviceCases'],
    queryFn: () => base44.entities.ServiceCase.list('-published_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCases'] });
      toast.success('案例已新增');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceCase.update(selectedCase.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCases'] });
      toast.success('案例已更新');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceCase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCases'] });
      toast.success('案例已刪除');
    },
  });

  const handlePhotoUpload = async (e, type) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [];

    for (const file of files) {
      try {
        const result = await base44.integrations.Core.UploadFile({ file });
        newPhotos.push(result.file_url);
      } catch (err) {
        toast.error(`上傳失敗: ${file.name}`);
      }
    }

    setUploadedPhotos(prev => ({
      ...prev,
      [type]: [...prev[type], ...newPhotos]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      before_photos: uploadedPhotos.before,
      after_photos: uploadedPhotos.after,
      published_date: formData.status === 'published' ? new Date().toISOString().split('T')[0] : null
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      service_type: '',
      location: '',
      client_story: '',
      cleaner_notes: '',
      tags: '',
      featured: false,
      status: 'draft'
    });
    setUploadedPhotos({ before: [], after: [] });
    setIsEditing(false);
    setSelectedCase(null);
  };

  const handleEdit = (caseItem) => {
    setSelectedCase(caseItem);
    setFormData({
      title: caseItem.title,
      description: caseItem.description,
      service_type: caseItem.service_type,
      location: caseItem.location,
      client_story: caseItem.client_story || '',
      cleaner_notes: caseItem.cleaner_notes || '',
      tags: caseItem.tags?.join(', ') || '',
      featured: caseItem.featured,
      status: caseItem.status
    });
    setUploadedPhotos({
      before: caseItem.before_photos || [],
      after: caseItem.after_photos || []
    });
    setIsEditing(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-stone-800">
            服務案例管理 <span className="font-medium">後台</span>
          </h1>
          <p className="text-stone-500 mt-2">上傳客戶對話、服務過程與效果展示</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">新增案例</TabsTrigger>
            <TabsTrigger value="list">案例列表</TabsTrigger>
          </TabsList>

          {/* Create/Edit Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? '編輯案例' : '新增服務案例'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>案例標題 *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="例：台北三房兩廳深度清潔"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>服務類型 *</Label>
                      <Select value={formData.service_type} onValueChange={(v) => setFormData({ ...formData, service_type: v })}>
                        <SelectTrigger><SelectValue placeholder="選擇服務類型" /></SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>服務地點</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="例：新北市板橋區"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>案例描述 *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="簡短描述這個服務案例的重點"
                      className="min-h-24"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>客戶對話/故事</Label>
                    <Textarea
                      value={formData.client_story}
                      onChange={(e) => setFormData({ ...formData, client_story: e.target.value })}
                      placeholder="記錄客戶的需求、對話或故事..."
                      className="min-h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>清潔師筆記</Label>
                    <Textarea
                      value={formData.cleaner_notes}
                      onChange={(e) => setFormData({ ...formData, cleaner_notes: e.target.value })}
                      placeholder="清潔師的工作筆記、特殊處理方式等"
                      className="min-h-24"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>標籤（逗號分隔）</Label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="例：深度清潔, 油煙機, 廚房"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>發布狀態</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">草稿</SelectItem>
                          <SelectItem value="published">已發布</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>服務前照片</Label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'before')}
                        className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                      />
                      {uploadedPhotos.before.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {uploadedPhotos.before.map((url, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                              <img src={url} alt="before" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setUploadedPhotos(prev => ({
                                  ...prev,
                                  before: prev.before.filter((_, idx) => idx !== i)
                                }))}
                                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>服務後照片</Label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'after')}
                        className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                      />
                      {uploadedPhotos.after.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {uploadedPhotos.after.map((url, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                              <img src={url} alt="after" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setUploadedPhotos(prev => ({
                                  ...prev,
                                  after: prev.after.filter((_, idx) => idx !== i)
                                }))}
                                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-stone-800 hover:bg-stone-900"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />處理中...</>
                      ) : (
                        <>
                          {isEditing ? '更新案例' : '新增案例'}
                        </>
                      )}
                    </Button>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        取消編輯
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              </div>
            ) : cases.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-stone-500">
                  目前沒有案例
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cases.map((caseItem) => (
                  <Card key={caseItem.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-stone-800">{caseItem.title}</h3>
                            <Badge variant={caseItem.status === 'published' ? 'default' : 'secondary'}>
                              {caseItem.status === 'published' ? '已發布' : '草稿'}
                            </Badge>
                            {caseItem.featured && (
                              <Badge className="bg-amber-100 text-amber-700">精選</Badge>
                            )}
                          </div>
                          <p className="text-sm text-stone-600 mb-2">{caseItem.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {caseItem.tags?.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(caseItem)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('確定要刪除嗎？')) {
                                deleteMutation.mutate(caseItem.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}