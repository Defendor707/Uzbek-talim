import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Search, MapPin, Phone, Mail, Globe, User, Users, Clock, Building2, Heart, Award } from 'lucide-react';

interface Center {
  id: number;
  username: string;
  fullName: string;
  centerName: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  description?: string;
  director?: string;
  establishedYear?: number;
  capacity?: number;
  specializations: string[];
  facilities: string[];
  workingHours?: string;
  profileImage?: string;
}

export default function SearchCenters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  const { data: centers, isLoading, refetch } = useQuery({
    queryKey: ['/api/centers/search', searchQuery, cityFilter, specializationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (cityFilter) params.append('city', cityFilter);
      if (specializationFilter) params.append('specialization', specializationFilter);
      
      const response = await fetch(`/api/centers/search?${params}`);
      if (!response.ok) throw new Error('Markaz qidirish xatosi');
      return response.json() as Promise<Center[]>;
    },
    enabled: true
  });

  const handleSearch = () => {
    refetch();
  };

  return (
    <ResponsiveDashboard userRole="parent" sections={[]} currentPage="Markaz qidirish">
      <div className="p-4 space-y-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Farzandingiz uchun markaz tanlang</h1>
          <p className="text-gray-600">Eng yaxshi ta'lim markazlarini ko'ring va farzandingiz uchun eng mosini tanlang</p>
        </div>

        {/* Search Filters */}
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-800">
              <Search className="h-5 w-5" />
              Markaz qidirish
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Markaz nomi</label>
                <Input
                  placeholder="Markaz nomi yoki tavsif..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Shahar</label>
                <Input
                  placeholder="Shahar nomi..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Qaysi fanga?</label>
                <Input
                  placeholder="Matematika, Ingliz tili..."
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch} className="w-full md:w-auto bg-pink-600 hover:bg-pink-700">
              <Search className="h-4 w-4 mr-2" />
              Qidirish
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {isLoading ? 'Qidirilmoqda...' : `${centers?.length || 0} ta markaz topildi`}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : centers?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Markaz topilmadi</h3>
                <p className="text-gray-600">Qidiruv shartlaringizni o'zgartiring va qayta urinib ko'ring</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {centers?.map((center) => (
                <Card key={center.id} className="hover:shadow-xl transition-shadow border-l-4 border-l-pink-500 bg-gradient-to-br from-white to-pink-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {center.profileImage ? (
                          <img
                            src={center.profileImage}
                            alt={center.centerName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-pink-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center border-2 border-pink-200">
                            <Building2 className="h-7 w-7 text-pink-600" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg text-pink-800">{center.centerName}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Direktor: {center.director}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {center.establishedYear && (
                          <Badge className="bg-pink-100 text-pink-800">{center.establishedYear}</Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-pink-400 fill-current" />
                          <span className="text-xs text-gray-600">Tavsiya</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {center.description && (
                      <p className="text-gray-700 text-sm bg-white p-3 rounded-lg border border-pink-100">{center.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      {center.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span className="font-medium">Manzil:</span> {center.address}
                        </div>
                      )}
                      {center.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Telefon:</span>
                          <a href={`tel:${center.phoneNumber}`} className="text-pink-600 hover:underline font-semibold">
                            {center.phoneNumber}
                          </a>
                        </div>
                      )}
                      {center.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Email:</span>
                          <a href={`mailto:${center.email}`} className="text-pink-600 hover:underline">
                            {center.email}
                          </a>
                        </div>
                      )}
                      {center.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded">
                          <Globe className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Veb-sayt:</span>
                          <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                            Tashrif buyurish
                          </a>
                        </div>
                      )}
                      {center.capacity && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">O'quvchilar soni:</span> {center.capacity} nafar
                        </div>
                      )}
                      {center.workingHours && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded">
                          <Clock className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium">Ish vaqti:</span> {center.workingHours}
                        </div>
                      )}
                    </div>

                    {center.specializations?.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-pink-100">
                        <p className="text-sm font-semibold mb-2 text-pink-800 flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          O'qitiladigan fanlar:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {center.specializations.map((spec, index) => (
                            <Badge key={index} className="bg-pink-100 text-pink-800 hover:bg-pink-200 text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {center.facilities?.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-pink-100">
                        <p className="text-sm font-semibold mb-2 text-pink-800">Qo'shimcha imkoniyatlar:</p>
                        <div className="flex flex-wrap gap-1">
                          {center.facilities.map((facility, index) => (
                            <Badge key={index} className="bg-green-100 text-green-800 text-xs">
                              {facility}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700">
                        Farzandim uchun
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 border-pink-300 text-pink-700 hover:bg-pink-50">
                        Batafsil ma'lumot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ResponsiveDashboard>
  );
}