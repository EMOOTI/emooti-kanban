import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const FirebaseTest: React.FC = () => {
    const [status, setStatus] = useState<string>('Verificando...');
    const [authStatus, setAuthStatus] = useState<string>('No autenticado');
    const [firestoreStatus, setFirestoreStatus] = useState<string>('No probado');

    useEffect(() => {
        // Verificar configuración de Firebase
        const checkFirebaseConfig = () => {
            try {
                if (auth && db) {
                    setStatus('✅ Firebase configurado correctamente');
                } else {
                    setStatus('❌ Error en la configuración de Firebase');
                }
            } catch (error) {
                setStatus(`❌ Error: ${error}`);
            }
        };

        // Verificar autenticación
        const checkAuth = () => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    setAuthStatus(`✅ Autenticado: ${user.email}`);
                } else {
                    setAuthStatus('❌ No autenticado');
                }
            });

            return unsubscribe;
        };

        // Verificar Firestore
        const checkFirestore = async () => {
            try {
                const testCollection = collection(db, 'test');
                const snapshot = await getDocs(testCollection);
                setFirestoreStatus(`✅ Firestore conectado (${snapshot.docs.length} documentos de prueba)`);
            } catch (error) {
                setFirestoreStatus(`❌ Error en Firestore: ${error}`);
            }
        };

        checkFirebaseConfig();
        const unsubscribe = checkAuth();
        checkFirestore();

        return () => unsubscribe();
    }, []);

    const testFirestoreWrite = async () => {
        try {
            const testCollection = collection(db, 'test');
            await addDoc(testCollection, {
                message: 'Prueba de escritura',
                timestamp: new Date().toISOString()
            });
            setFirestoreStatus('✅ Escritura en Firestore exitosa');
        } catch (error) {
            setFirestoreStatus(`❌ Error de escritura: ${error}`);
        }
    };

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-bold mb-4">🔧 Prueba de Firebase</h3>
            
            <div className="space-y-2">
                <div>
                    <strong>Configuración:</strong> {status}
                </div>
                <div>
                    <strong>Autenticación:</strong> {authStatus}
                </div>
                <div>
                    <strong>Firestore:</strong> {firestoreStatus}
                </div>
            </div>

            <button
                onClick={testFirestoreWrite}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Probar Escritura en Firestore
            </button>
        </div>
    );
};

export default FirebaseTest;
