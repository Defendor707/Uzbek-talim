import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Search, MapPin, Phone, Mail, Globe, User, Users, Clock, Building2 } from 'lucide-react';

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
    <ResponsiveDashboard userRole="teacher" sections={[]} currentPage="Markaz qidirish">
      <div className="p-4 space-y-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">O'quv markazlarini qidirish</h1>
          <p className="text-gray-600">Eng yaxshi o'quv markazlarini toping va ularga qo'shiling</p>
        </div>

        {/* Search Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Qidiruv filtrlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Markaz nomi yoki tavsif</label>
                <Input
                  placeholder="Markaz nomi, tavsif yoki direktor..."
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
                <label className="text-sm font-medium mb-2 block">Mutaxassislik</label>
                <Input
                  placeholder="Mutaxassislik..."
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch} className="w-full md:w-auto">
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
                <Card key={center.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {center.profileImage ? (
                          <img
                            src={center.profileImage}
                            alt={center.centerName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{center.centerName}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {center.director}
                          </CardDescription>
                        </div>
                      </div>
                      {center.establishedYear && (
                        <Badge variant="secondary">{center.establishedYear}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {center.description && (
                      <p className="text-gray-600 text-sm">{center.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      {center.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {center.address}
                        </div>
                      )}
                      {center.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {center.phoneNumber}
                        </div>
                      )}
                      {center.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {center.email}
                        </div>
                      )}
                      {center.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="h-4 w-4" />
                          <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {center.website}
                          </a>
                        </div>
                      )}
                      {center.capacity && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          {center.capacity} o'quvchi sig'imi
                        </div>
                      )}
                      {center.workingHours && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {center.workingHours}
                        </div>
                      )}
                    </div>

                    {center.specializations?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Mutaxassisliklar:</p>
                        <div className="flex flex-wrap gap-1">
                          {center.specializations.map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {center.facilities?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Imkoniyatlar:</p>
                        <div className="flex flex-wrap gap-1">
                          {center.facilities.map((facility, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {facility}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Bog'lanish
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Batafsil
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