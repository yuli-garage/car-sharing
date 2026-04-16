import { firebaseConfig } from './config.js';

let database;

export function initFirebase(callbacks) {
    const { onConnectionChange, onDataUpdate } = callbacks;

    if (typeof firebase === 'undefined') {
        onConnectionChange('offline');
        return null;
    }

    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();

        database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                onConnectionChange('online');
            } else {
                onConnectionChange('offline');
            }
        });

        return database;
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        onConnectionChange('offline');
        return null;
    }
}

export async function createGroup(groupCode, password, nickname, userId) {
    if (!database) throw new Error('Database not initialized');

    await database.ref(`groups/${groupCode}`).set({
        password: password,
        createdAt: Date.now(),
        cars: {},
        members: {
            [userId]: {
                nickname: nickname,
                joinedAt: Date.now()
            }
        }
    });
}

export async function joinGroup(code, password, nickname, userId) {
    if (!database) throw new Error('Database not initialized');

    const groupSnapshot = await database.ref(`groups/${code}`).once('value');
    const groupData = groupSnapshot.val();

    if (!groupData) throw new Error('존재하지 않는 그룹 코드입니다');
    if (groupData.password !== password) throw new Error('비밀번호가 틀렸습니다');

    await database.ref(`groups/${code}/members/${userId}`).set({
        nickname: nickname,
        joinedAt: Date.now()
    });
}

export function listenToGroupCars(groupCode, callback) {
    if (!database) return;
    
    database.ref(`groups/${groupCode}/cars`).off();
    database.ref(`groups/${groupCode}/cars`).on('value', (snapshot) => {
        const data = snapshot.val();
        const cars = data ? Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })) : [];
        callback(cars);
    });
}

export async function saveCarsToFirebase(groupCode, cars) {
    if (!database) return;

    const carsData = {};
    cars.forEach(car => {
        carsData[car.id] = {
            name: car.name,
            location: car.location,
            lastUpdated: car.lastUpdated,
            updatedBy: car.updatedBy
        };
    });

    await database.ref(`groups/${groupCode}/cars`).set(carsData);
}
