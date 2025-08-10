import React, { useState, useEffect } from 'react';
import { User, Priority } from '../types';
import { XIcon, TrashIcon, ReplyIcon } from './icons';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';

interface Message {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    subject: string;
    message: string;
    priority: Priority;
    createdAt: Timestamp;
    read: boolean;
}

interface InboxViewProps {
    currentUser: User;
    onSendMessage: (messageData: {
        toUserId: string;
        subject: string;
        message: string;
        priority: Priority;
    }) => void;
}

const InboxView: React.FC<InboxViewProps> = ({ currentUser, onSendMessage }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<string>('');
    const [replySubject, setReplySubject] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMessages();
    }, [currentUser.id]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef,
                where('toUserId', '==', currentUser.id),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const messagesData: Message[] = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                messagesData.push({
                    id: doc.id,
                    fromUserId: data.fromUserId,
                    fromUserName: data.fromUserName,
                    toUserId: data.toUserId,
                    subject: data.subject,
                    message: data.message,
                    priority: data.priority,
                    createdAt: data.createdAt,
                    read: data.read || false
                });
            });
            
            setMessages(messagesData);
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessageClick = (message: Message) => {
        setSelectedMessage(message);
        // Marcar como leído si no lo está
        if (!message.read) {
            markAsRead(message.id);
        }
    };

    const markAsRead = async (messageId: string) => {
        try {
            const messageRef = doc(db, 'messages', messageId);
            await updateDoc(messageRef, { read: true });
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === messageId ? { ...msg, read: true } : msg
                )
            );
        } catch (error) {
            console.error('Error marcando mensaje como leído:', error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteDoc(doc(db, 'messages', messageId));
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error('Error eliminando mensaje:', error);
        }
    };

    const handleReply = (message: Message) => {
        setReplyTo(message.fromUserId);
        setReplySubject(`Re: ${message.subject}`);
        setReplyMessage('');
        setIsReplyModalOpen(true);
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!replyMessage.trim()) {
            alert('Por favor escribe un mensaje');
            return;
        }

        try {
            // Enviar el mensaje de respuesta
            await onSendMessage({
                toUserId: replyTo,
                subject: replySubject,
                message: replyMessage,
                priority: Priority.Medium
            });
            
            setIsReplyModalOpen(false);
            setReplyTo('');
            setReplySubject('');
            setReplyMessage('');
        } catch (error) {
            console.error('Error enviando respuesta:', error);
        }
    };

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.Urgent:
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case Priority.High:
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case Priority.Medium:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case Priority.Low:
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getPriorityText = (priority: Priority) => {
        switch (priority) {
            case Priority.Urgent:
                return 'Urgente';
            case Priority.High:
                return 'Alta';
            case Priority.Medium:
                return 'Media';
            case Priority.Low:
                return 'Baja';
            default:
                return 'Normal';
        }
    };

    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffInHours < 48) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* Lista de mensajes */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Bandeja de Entrada ({messages.length})
                    </h2>
                </div>
                
                {messages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p>No hay mensajes</p>
                        <p className="text-sm">Los mensajes que recibas aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                onClick={() => handleMessageClick(message)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                    selectedMessage?.id === message.id 
                                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                                        : ''
                                } ${!message.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                                                {getPriorityText(message.priority)}
                                            </span>
                                            {!message.read && (
                                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                            )}
                                        </div>
                                        <p className={`text-sm font-medium truncate ${!message.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {message.fromUserName}
                                        </p>
                                        <p className={`text-sm truncate ${!message.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {message.subject}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formatDate(message.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detalle del mensaje */}
            <div className="flex-1 flex flex-col">
                {selectedMessage ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedMessage.priority)}`}>
                                        {getPriorityText(selectedMessage.priority)}
                                    </span>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedMessage.subject}
                                    </h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleReply(selectedMessage)}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        title="Responder"
                                    >
                                        <ReplyIcon />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        title="Eliminar"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>De: {selectedMessage.fromUserName}</span>
                                <span className="mx-2">•</span>
                                <span>{formatDate(selectedMessage.createdAt)}</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-gray-900 dark:text-white">
                                    {selectedMessage.message}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>Selecciona un mensaje para ver su contenido</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de respuesta */}
            {isReplyModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Responder Mensaje
                            </h2>
                            <button
                                onClick={() => setIsReplyModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XIcon />
                            </button>
                        </div>

                        <form onSubmit={handleSendReply} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Asunto
                                </label>
                                <input
                                    type="text"
                                    value={replySubject}
                                    onChange={(e) => setReplySubject(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-black dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mensaje
                                </label>
                                <textarea
                                    rows={6}
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-black dark:text-white"
                                    placeholder="Escribe tu respuesta..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsReplyModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Enviar Respuesta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InboxView; 