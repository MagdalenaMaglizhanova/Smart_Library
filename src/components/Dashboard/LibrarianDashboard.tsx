// src/components/Dashboard/LibrarianDashboard.tsx
import React from 'react';

const LibrarianDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Библиотекарски Панел</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Управление на Книги</h3>
            <p className="text-gray-600">Добавяне, редактиране и изтриване на книги</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Събития</h3>
            <p className="text-gray-600">Създаване и управление на библиотечни събития</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Потребители</h3>
            <p className="text-gray-600">Преглед на потребители и техните резервации</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Бързи Действия</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              Добави Нова Книга
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
              Създай Събитие
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
              Преглед на Резервации
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;