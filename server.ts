import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { db, withDbRetry } from './src/db/index.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  users,
  healthLogs,
  meals,
  preMealLogs,
  postMealLogs,
  symptoms,
  sleepLogs,
  activityLogs,
  hydrationLogs,
  foodDatabase,
  educationArticles,
  categories,
  notifications,
  passwordResets,
  healthExaminations,
  systemActivities,
} from './src/db/schema.ts';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { generateToken } from './src/lib/jwt.ts';
import { requireAuth, requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { seedDatabase } from './src/db/seed.ts';
import { initDatabase } from './src/db/init.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT =
  process.env.APP_PORT ||
  (process.env.PORT && process.env.PORT !== process.env.NGINX_PORT ? process.env.PORT : '3000');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Auto-initialize tables and seed database on startup
const dbReady = initDatabase()
  .then(() => seedDatabase())
  .catch((err) => {
    console.error('Database initialization / seed check warning:', err.message);
  });

// ==========================================
// PUBLIC HEALTH CHECK & ARTICLES (NO LOGIN REQUIRED)
// ==========================================
app.get('/api/public/articles', async (req, res) => {
  try {
    const articles = await db
      .select()
      .from(educationArticles)
      .where(eq(educationArticles.isPublished, true))
      .orderBy(desc(educationArticles.createdAt));
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat artikel publik' });
  }
});

app.post('/api/public/health-check', async (req, res) => {
  try {
    const { energy, mood, bodyCondition, stomachCondition, stressLevel, symptoms, lastMeal } = req.body;

    // Calculate score out of 100
    // Energy: 10 points per energy level (max 40)
    // Stress: 10 - stressLevel (max 30)
    // Stomach: Nyaman (30), Sedikit Begah (20), Kembung/Mual (10), Perih (5)
    const energyScore = (Number(energy) || 5) * 4;
    const stressScore = Math.max(0, 10 - (Number(stressLevel) || 5)) * 3;

    let stomachScore = 30;
    const stom = (stomachCondition || '').toLowerCase();
    if (stom.includes('perih')) stomachScore = 5;
    else if (stom.includes('mual') || stom.includes('kembung')) stomachScore = 12;
    else if (stom.includes('begah')) stomachScore = 20;

    const totalScore = Math.min(100, Math.max(20, Math.round(energyScore + stressScore + stomachScore)));

    let status = 'Kondisi Optimal';
    let summaryText = 'Kondisi vital dan pencernaan Anda saat ini dalam rentang yang baik dan seimbang.';
    const recommendations: string[] = [];

    if (totalScore < 50) {
      status = 'Perlu Perhatian Segera';
      summaryText = 'Tubuh Anda menunjukkan sinyal kelelahan atau gangguan kenyamanan lambung yang signifikan.';
      recommendations.push('Hindari konsumsi makanan pedas, asam, atau berkafein tinggi hari ini.');
      recommendations.push('Beristirahatlah sejenak dan lakukan teknik pernapasan relaksasi 4-7-8 untuk menurunkan kortisol.');
      recommendations.push('Jika perih lambung berlanjut lebih dari 2 hari, segera konsultasikan dengan dokter umum atau spesialis penyakit dalam.');
    } else if (totalScore < 75) {
      status = 'Kondisi Cukup Sehat';
      summaryText = 'Ada sedikit indikasi kelelahan fisik atau stres ringan yang mempengaruhi pencernaan Anda.';
      recommendations.push('Minum air putih hangat bertahap minimal 1.5 - 2 liter hari ini.');
      recommendations.push('Makan tepat waktu dengan porsi sedang untuk mencegah asam lambung naik.');
      recommendations.push('Lakukan peregangan otot ringan selama 10-15 menit untuk melancarkan sirkulasi.');
    } else {
      recommendations.push('Pertahankan hidrasi dan kualitas tidur nyenyak 7-8 jam per malam.');
      recommendations.push('Kombinasikan serat sayur dan protein tanpa lemak pada jadwal makan berikutnya.');
      recommendations.push('Kondisi tubuh sangat prima untuk beraktivitas produktif hari ini.');
    }

    res.json({
      score: totalScore,
      status,
      summaryText,
      analysis: {
        energyLevel: `${energy}/10`,
        stressLevel: `${stressLevel}/10`,
        stomachCondition: stomachCondition || 'Normal',
        bodyCondition: bodyCondition || 'Normal',
        mood: mood || 'Netral',
      },
      recommendations,
      disclaimer:
        'Data ini berasal dari pemeriksaan mandiri berbasis kuesioner pengguna dan bukan merupakan diagnosis medis formal.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memproses analisis kesehatan' });
  }
});

// ==========================================
// PUBLIC MENTAL HEALTH CHECK (NO LOGIN REQUIRED)
// ==========================================
app.post('/api/public/mental-health-check', async (req, res) => {
  try {
    const {
      feelingScore = 3,
      anxietyLevel = 3,
      overthinkingFrequency = 'Kadang-kadang',
      sleepCalmness = 'Cukup Nyenyak',
      dailyEnthusiasm = 'Cukup Bersemangat',
      physicalStress = [],
      supportSystem = 'Ada Keluarga/Sahabat yang Mendukung',
      notes = '',
    } = req.body;

    // Base score calculation out of 100
    // Feeling score: 1-5 (weight 25) -> (feelingScore / 5) * 25
    const fScore = (Number(feelingScore) / 5) * 25;

    // Anxiety reverse: 1-5 (1 is low anxiety -> 25 pts, 5 is high anxiety -> 5 pts)
    const anxietyReverse = Math.max(1, 6 - Number(anxietyLevel));
    const aScore = (anxietyReverse / 5) * 25;

    // Overthinking
    let otScore = 15;
    if (overthinkingFrequency === 'Jarang') otScore = 15;
    else if (overthinkingFrequency === 'Kadang-kadang') otScore = 11;
    else if (overthinkingFrequency === 'Sering') otScore = 6;
    else if (overthinkingFrequency === 'Hampir Setiap Saat') otScore = 2;

    // Sleep calmness
    let sleepScore = 15;
    if (sleepCalmness === 'Sangat Nyenyak & Tenang') sleepScore = 15;
    else if (sleepCalmness === 'Cukup Nyenyak') sleepScore = 11;
    else if (sleepCalmness === 'Sering Terbangun/Gelisah') sleepScore = 6;
    else sleepScore = 2;

    // Daily enthusiasm
    let enthusScore = 10;
    if (dailyEnthusiasm === 'Penuh Semangat') enthusScore = 10;
    else if (dailyEnthusiasm === 'Cukup Bersemangat') enthusScore = 7;
    else if (dailyEnthusiasm === 'Mudah Lelah/Hambar') enthusScore = 4;
    else enthusScore = 1;

    // Support system
    let supportScore = 10;
    if (supportSystem === 'Ada Keluarga/Sahabat yang Mendukung') supportScore = 10;
    else if (supportSystem === 'Ada tetapi Sulit Terbuka') supportScore = 6;
    else supportScore = 2;

    // Physical symptoms penalty
    const physCount = Array.isArray(physicalStress) ? physicalStress.filter((s: string) => s !== 'Tidak Ada Gejala').length : 0;
    const physPenalty = Math.min(15, physCount * 3);

    const totalRaw = fScore + aScore + otScore + sleepScore + enthusScore + supportScore - physPenalty;
    const finalScore = Math.min(100, Math.max(15, Math.round(totalRaw)));

    let statusCategory = 'Kondisi Mental Sangat Baik & Berdaya';
    let statusTone = 'EXCELLENT';
    let stressBadge = 'Tingkat Stres: Rendah & Terkelola';
    let summaryText = 'Kondisi emosional dan pikiran Anda berada dalam frekuensi yang seimbang, tenang, dan memiliki resiliensi (daya tahan mental) yang sangat baik untuk menghadapi aktivitas harian.';
    const recommendations: string[] = [];
    let warmAffirmation = 'Terus rawat ketenangan ini dengan meluangkan waktu bersyukur dan menikmati hal-hal kecil setiap hari.';

    if (finalScore < 45) {
      statusCategory = 'Beban Pikiran & Emosional Sedang Menumpuk';
      statusTone = 'CONCERN';
      stressBadge = 'Tingkat Stres: Tinggi / Kelelahan Mental';
      summaryText = 'Hati dan pikiran Anda saat ini sedang memikul beban yang cukup berat. Ini adalah hal yang wajar dirasakan oleh manusia, dan bukan berarti Anda lemah. Tubuh dan jiwa Anda hanya sedang memberi sinyal bahwa Anda butuh istirahat sejati dan ruang untuk bernapas tanpa dituntut serba sempurna.';
      recommendations.push('Hentikan sejenak tuntutan untuk menyelesaikan segalanya hari ini. Berikan diri Anda izin istirahat minimal 1–2 jam tanpa memikirkan pekerjaan atau masalah.');
      recommendations.push('Lakukan teknik pernapasan lambat (tarik napas lembut 4 detik, tahan 4 detik, hembuskan perlahan 6 detik) sebanyak 5 siklus saat rasa cemas muncul.');
      recommendations.push('Kurangi konsumsi berita yang memicu kecemasan dan batasi penggunaan media sosial sebelum tidur malam.');
      recommendations.push('Cobalah bercerita kepada satu orang yang Anda percayai, atau hubungi konselor / psikolog profesional bila perasaan sesak ini berlanjut.');
      warmAffirmation = 'Anda sudah berusaha sebaik mungkin sampai hari ini. Beristirahat bukanlah tanda menyerah, melainkan bentuk kasih sayang paling tulus untuk diri sendiri.';
    } else if (finalScore < 70) {
      statusCategory = 'Lelah Mental Ringan (Perlu Jeda & Relaksasi)';
      statusTone = 'MILD';
      stressBadge = 'Tingkat Stres: Sedang (Fluktuasi Wajar)';
      summaryText = 'Ada beberapa hal yang mengganjal atau membuat pikiran Anda berputar lebih kencang dari biasanya. Keseimbangan Anda masih cukup baik, namun jika dibiarkan tanpa relaksasi, kelelahan ini bisa menguras energi fisik Anda.';
      recommendations.push('Sempatkan berjalan kaki santai di pagi atau sore hari selama 15–20 menit untuk menyegarkan sirkulasi dan hormon endorfin.');
      recommendations.push('Tuliskan apa saja yang Anda khawatirkan di selembar kertas, lalu pilih hanya 1 hal yang benar-benar bisa Anda kendalikan hari ini.');
      recommendations.push('Jaga jam tidur agar teratur dan nikmati minuman hangat seperti teh chamomile atau susu hangat di malam hari.');
      recommendations.push('Sediakan waktu untuk hobi ringan yang menyenangkan hati tanpa target hasil.');
      warmAffirmation = 'Setiap hari adalah proses bertumbuh. Tidak apa-apa jika hari ini Anda hanya melangkah pelan, yang terpenting Anda tetap melangkah.';
    } else {
      recommendations.push('Pertahankan rutinitas istirahat dan pola makan bergizi yang menopang hormon kebahagiaan.');
      recommendations.push('Bagikan energi positif dan dengarkan orang-orang terdekat yang mungkin sedang membutuhkan dukungan Anda.');
      recommendations.push('Luangkan 10 menit setiap pagi untuk hening, berdoa, atau bermeditasi agar fokus batin tetap jernih.');
      recommendations.push('Tetap jadwalkan waktu istirahat dan jangan memaksakan diri bekerja berlebihan meski tubuh terasa bersemangat.');
    }

    res.json({
      score: finalScore,
      category: statusCategory,
      tone: statusTone,
      stressBadge,
      summary: summaryText,
      recommendations,
      affirmation: warmAffirmation,
      details: {
        feelingScore: `${feelingScore}/5`,
        anxietyLevel: `${anxietyLevel}/5`,
        overthinkingFrequency,
        sleepCalmness,
        dailyEnthusiasm,
        supportSystem,
        physicalSymptomsCount: physCount,
      },
      disclaimer:
        'Pemeriksaan mental mandiri ini bertujuan untuk refleksi kesejahteraan emosional dan perawatan diri (self-care). Jika Anda merasakan kesedihan mendalam yang berkepanjangan, jangan ragu untuk berkonsultasi langsung dengan psikolog, psikiater, atau hotline Sejiwa Kemenkes (119 ext 8).',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memproses penilaian kesehatan mental' });
  }
});

// ==========================================
// PUBLIC FOOD EFFECT CHECK (NO LOGIN REQUIRED)
// ==========================================
app.post('/api/public/food-effect', async (req, res) => {
  try {
    const { foodName, portion, drinkNotes, conditionBefore } = req.body;

    if (!foodName || !foodName.trim()) {
      return res.status(400).json({ error: 'Nama makanan wajib diisi' });
    }

    const query = foodName.toLowerCase().trim();

    // Check if food exists in foodDatabase table
    const dbMatches = await db
      .select()
      .from(foodDatabase)
      .where(sql`LOWER(${foodDatabase.name}) LIKE ${'%' + query + '%'}`)
      .limit(1);

    const matchedFood = dbMatches[0] || null;

    // Physiological Analysis
    const isSpicy = query.includes('pedas') || query.includes('sambal') || query.includes('geprek') || query.includes('balado') || query.includes('rica');
    const isFriedOrFatty = query.includes('goreng') || query.includes('rendang') || query.includes('santan') || query.includes('gulai') || query.includes('lemak') || query.includes('crispy') || query.includes('mentega');
    const isHighCarb = query.includes('mie') || query.includes('nasi') || query.includes('roti') || query.includes('pasta') || query.includes('bakso') || query.includes('donat');
    const isSweet = query.includes('manis') || query.includes('boba') || query.includes('kue') || query.includes('es ') || query.includes('sirup') || query.includes('cokelat');
    const isHealthyFiber = query.includes('oat') || query.includes('sayur') || query.includes('salad') || query.includes('buah') || query.includes('bayam') || query.includes('ikan');
    const isCoffee = query.includes('kopi') || query.includes('espresso') || query.includes('caffeine');

    let digestionTime = '2 - 3 Jam';
    let stomachImpact = 'Kategori Ramah Lambung';
    let stomachImpactType: 'SAFE' | 'WARNING' | 'ALERT' = 'SAFE';
    let glycemicImpact = 'Sedang';
    let expectedEnergyCurve = 'Kestabilan energi terjaga 3-4 jam.';
    const effects: string[] = [];
    const healthAdvice: string[] = [];

    if (isFriedOrFatty && isSpicy) {
      stomachImpact = 'Beban Lambung Berat & Potensi Iritasi Asam Lambung';
      stomachImpactType = 'ALERT';
      digestionTime = '4 - 5 Jam';
      glycemicImpact = 'Tinggi & Lambat Dicerna';
      expectedEnergyCurve = 'Kenyang sangat padat, potensi lemas/kantuk berat dalam 45 menit ke depan.';
      effects.push('Kandungan kapsaisin dan lemak memperlambat pengosongan lambung (*delayed gastric emptying*).');
      effects.push('Risiko sensasi panas di ulu hati (*heartburn*) atau perut begah kembung.');
      effects.push('Pergeseran sirkulasi darah ke saluran pencernaan memicu rasa mengantuk (*postprandial somnolence*).');
      healthAdvice.push('Dilarang langsung berbaring atau tidur setidaknya selama 2-3 jam setelah makan.');
      healthAdvice.push('Minum air putih hangat sedikit demi sedikit; hindari air es atau soda.');
      healthAdvice.push('Jalan santai ringan 10-15 menit untuk membantu motilitas saluran cerna.');
    } else if (isFriedOrFatty) {
      stomachImpact = 'Tinggi Lemak / Perlu Waktu Cerna Lebih Panjang';
      stomachImpactType = 'WARNING';
      digestionTime = '3.5 - 4.5 Jam';
      expectedEnergyCurve = 'Rasa kenyang bertahan lama namun rentan memicu kembung jika porsi besar.';
      effects.push('Tingginya asam lemak memerlukan pelepasan enzim lipase dan empedu ekstra.');
      effects.push('Pemberian sinyal hormon kolesistokinin (CCK) yang memicu rasa kenyang penuh dan rileks.');
      healthAdvice.push('Batasi camilan manis tambahan agar tidak memperberat kerja organ hati.');
      healthAdvice.push('Hindari pakaian dengan celana/ikat pinggang yang terlalu menekan perut.');
    } else if (isSpicy) {
      stomachImpact = 'Sensasi Hangat & Peningkatan Produksi Asam Lambung';
      stomachImpactType = 'WARNING';
      digestionTime = '2.5 - 3.5 Jam';
      effects.push('Merangsang sekresi asam hidroklorida (HCl) di dinding mukosa lambung.');
      effects.push('Meningkatkan laju metabolisme basal sementara.');
      healthAdvice.push('Jika perut terasa agak perih, konsumsi segelas air hangat atau susu kedelai/oat.');
    } else if (isHighCarb || isSweet) {
      stomachImpact = 'Pencernaan Cepat dengan Lonjakan Glukosa';
      stomachImpactType = 'WARNING';
      digestionTime = '2 - 3 Jam';
      glycemicImpact = 'Tinggi';
      expectedEnergyCurve = 'Lonjakan energi cepat di 30 menit awal, diikuti penurunan (*crash*) dan mengantuk.';
      effects.push('Lonjakan glukosa darah menstimulasi pelepasan hormon insulin dalam jumlah besar.');
      effects.push('Tryptophan masuk ke otak lebih mudah, memicu produksi serotonin dan melatonin (efek kantuk).');
      healthAdvice.push('Lakukan peregangan otot atau aktivitas berjalan kaki singkat untuk menstabilkan gula darah.');
      healthAdvice.push('Sediakan air putih untuk menjaga hidrasi selular.');
    } else if (isHealthyFiber) {
      stomachImpact = 'Sangat Ramah Mukosa Lambung & Usus';
      stomachImpactType = 'SAFE';
      digestionTime = '2 - 3 Jam';
      glycemicImpact = 'Rendah - Seimbang';
      expectedEnergyCurve = 'Energi stabil, fokus mental tajam tanpa rasa kantuk berat.';
      effects.push('Serat larut difermentasi mikrobioma usus menghasilkan Short-Chain Fatty Acids (SCFA) pelindung dinding usus.');
      effects.push('Pengosongan lambung berjalan harmonis tanpa lonjakan asam berlebih.');
      healthAdvice.push('Pertahankan asupan cairan harian 2 liter agar serat bekerja optimal.');
    } else {
      effects.push('Makanan diproses secara bertahap oleh enzim lambung pepsin dan amilase.');
      effects.push('Kadar glukosa dan asam amino meningkat bertahap dalam sirkulasi darah.');
      healthAdvice.push('Konsumsi air putih secukupnya setelah makan dan hindari aktivitas fisik sangat berat.');
    }

    if (isCoffee) {
      effects.push('Kandungan kafein menstimulasi sistem saraf pusat dan menurunkan tonus katup lambung bawah.');
      healthAdvice.push('Sebaiknya hindari minum kopi dalam kondisi perut kosong total.');
    }

    res.json({
      foodName,
      portion: portion || '1 Porsi Standar',
      databaseMatch: matchedFood ? {
        calories: matchedFood.calories,
        protein: matchedFood.protein,
        carbs: matchedFood.carbs,
        fat: matchedFood.fat,
        standardPortion: matchedFood.standardPortion,
      } : null,
      digestionTime,
      stomachImpact,
      stomachImpactType,
      glycemicImpact,
      expectedEnergyCurve,
      effects,
      healthAdvice,
      disclaimer:
        'Keterangan efek fisiologis ini diolah secara prediktif berdasarkan profil nutrisi umum dan bukan diagnosis medis individual.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menganalisis efek makanan' });
  }
});

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    await dbReady;
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi minimal 6 karakter' });
    }

    const normalizedEmail = (email || '').toLowerCase().trim();

    // Check existing email
    const existing = await withDbRetry(() =>
      db
        .select()
        .from(users)
        .where(sql`LOWER(TRIM(${users.email})) = LOWER(TRIM(${normalizedEmail}))`)
        .limit(1)
    );

    if (existing.length > 0) {
      if (!existing[0].passwordHash) {
        // Account existed without local password (e.g. from Google auth). Set password now!
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const [updatedUser] = await db
          .update(users)
          .set({ passwordHash, name: name.trim(), updatedAt: new Date() })
          .where(eq(users.id, existing[0].id))
          .returning();

        const token = generateToken({
          id: updatedUser.id,
          uid: updatedUser.uid,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role as 'ADMIN' | 'USER',
        });

        return res.status(200).json({
          message: 'Akun Anda telah diaktifkan dengan kata sandi baru.',
          token,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
          },
        });
      }
      return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login atau gunakan menu Lupa Kata Sandi jika Anda lupa kata sandi.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const [newUser] = await db
      .insert(users)
      .values({
        uid: userUid,
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role: 'USER', // User cannot assign own role
        isActive: true,
      })
      .returning();

    // Audit log
    try {
      await db.insert(systemActivities).values({
        userId: newUser.id,
        userName: newUser.name,
        userEmail: newUser.email,
        action: 'REGISTER',
        description: `Pengguna baru mendaftar: ${newUser.name} (${newUser.email})`,
        createdAt: new Date(),
      });
    } catch {}

    const token = generateToken({
      id: newUser.id,
      uid: newUser.uid,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as 'ADMIN' | 'USER',
    });

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftar. Silakan coba lagi.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    await dbReady;
    const authHeader = req.headers.authorization;
    const { email, password, rememberMe } = req.body || {};

    // Support Google/Firebase Bearer token login when sent without email/password
    if ((!email || !password) && authHeader && authHeader.startsWith('Bearer ')) {
      const firebaseToken = authHeader.split('Bearer ')[1].trim();
      try {
        const firebaseDecoded = await adminAuth.verifyIdToken(firebaseToken);
        const fbEmail = (firebaseDecoded.email || `${firebaseDecoded.uid}@google.user`).toLowerCase().trim();

        let dbUser = await withDbRetry(() =>
          db
            .select()
            .from(users)
            .where(eq(users.uid, firebaseDecoded.uid))
            .limit(1)
        );

        if (dbUser.length === 0 && firebaseDecoded.email) {
          dbUser = await withDbRetry(() =>
            db
              .select()
              .from(users)
              .where(sql`LOWER(TRIM(${users.email})) = LOWER(TRIM(${fbEmail}))`)
              .limit(1)
          );
          if (dbUser.length > 0) {
            const [updated] = await withDbRetry(() =>
              db
                .update(users)
                .set({
                  uid: firebaseDecoded.uid,
                  avatar: dbUser[0].avatar || firebaseDecoded.picture || null,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, dbUser[0].id))
                .returning()
            );
            dbUser = [updated];
          }
        }

        if (dbUser.length === 0) {
          const [inserted] = await withDbRetry(() =>
            db
              .insert(users)
              .values({
                uid: firebaseDecoded.uid,
                email: fbEmail,
                name: firebaseDecoded.name || 'Pengguna Google',
                role: 'USER',
                isActive: true,
                avatar: firebaseDecoded.picture || null,
              })
              .returning()
          );
          dbUser = [inserted];
        }

        const googleUser = dbUser[0];
        if (!googleUser.isActive) {
          return res.status(403).json({ error: 'Akun Anda dinonaktifkan. Hubungi admin MedikaCheck.' });
        }

        const token = generateToken(
          {
            id: googleUser.id,
            uid: googleUser.uid,
            email: googleUser.email,
            name: googleUser.name,
            role: googleUser.role as 'ADMIN' | 'USER',
          },
          true
        );

        return res.json({
          message: 'Login berhasil',
          token,
          user: {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            role: googleUser.role,
            avatar: googleUser.avatar,
          },
        });
      } catch (fbErr) {
        console.error('Firebase token login error:', fbErr);
        return res.status(401).json({ error: 'Token Google tidak valid atau kedaluwarsa. Silakan coba lagi.' });
      }
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const foundUsers = await withDbRetry(() =>
      db
        .select()
        .from(users)
        .where(sql`LOWER(TRIM(${users.email})) = LOWER(TRIM(${normalizedEmail}))`)
        .limit(1)
    );

    if (foundUsers.length === 0) {
      return res.status(401).json({ error: 'Email tidak ditemukan atau belum terdaftar. Silakan periksa kembali email Anda atau daftar akun baru.' });
    }

    const user = foundUsers[0];

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan. Hubungi admin MedikaCheck.' });
    }

    if (!user.passwordHash) {
      // If user registered with Google previously without password, link password now
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      await withDbRetry(() =>
        db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id))
      );
      user.passwordHash = newHash;
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && typeof password === 'string') {
      isMatch = await bcrypt.compare(password.trim(), user.passwordHash);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi tidak sesuai. Silakan coba lagi atau gunakan fitur Lupa Kata Sandi.' });
    }

    // Audit log
    try {
      await db.insert(systemActivities).values({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'LOGIN',
        description: `${user.name} berhasil masuk ke sistem`,
        createdAt: new Date(),
      });
    } catch {}

    const token = generateToken(
      {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role as 'ADMIN' | 'USER',
      },
      Boolean(rememberMe)
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Gagal memproses login. Silakan coba beberapa saat lagi.' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi' });
    }

    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (found.length === 0) {
      // Security standard: don't reveal email non-existence, but inform instructions sent
      return res.json({
        message: 'Jika email terdaftar, instruksi pemulihan kata sandi telah dikirimkan ke email Anda.',
      });
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResets).values({
      email: found[0].email,
      token,
      expiresAt,
      used: false,
    });

    res.json({
      message: 'Instruksi pemulihan kata sandi telah diproses.',
      resetToken: token, // Included for in-app flow & testing
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Gagal memproses permintaan reset kata sandi' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token dan kata sandi baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter' });
    }

    const resetRecords = await db
      .select()
      .from(passwordResets)
      .where(and(eq(passwordResets.token, token), eq(passwordResets.used, false)))
      .limit(1);

    if (resetRecords.length === 0) {
      return res.status(400).json({ error: 'Token reset tidak valid atau sudah pernah digunakan' });
    }

    const resetRecord = resetRecords[0];
    if (new Date() > new Date(resetRecord.expiresAt)) {
      return res.status(400).json({ error: 'Token reset telah kedaluwarsa. Silakan ajukan ulang.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.email, resetRecord.email));

    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, resetRecord.id));

    res.json({ message: 'Kata sandi berhasil diperbarui. Silakan login dengan kata sandi baru.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Gagal mereset kata sandi' });
  }
});

// Current User Profile
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userRecords = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (userRecords.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({ user: userRecords[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

// Update Profile (Name & Avatar)
app.put('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama pengguna wajib diisi' });
    }

    const updatePayload: any = {
      name: name.trim(),
      updatedAt: new Date(),
    };

    if (avatar !== undefined) {
      updatePayload.avatar = avatar;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, req.user!.id))
      .returning({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt,
      });

    // Record system activity
    try {
      await db.insert(systemActivities).values({
        userId: req.user!.id,
        userName: updatedUser.name,
        userEmail: updatedUser.email,
        action: 'PROFILE_UPDATE',
        description: `${updatedUser.name} memperbarui informasi profil`,
        createdAt: new Date(),
      });
    } catch {}

    res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Gagal memperbarui profil pengguna' });
  }
});

// ==========================================
// INTEGRATED HEALTH EXAMINATIONS (CATATAN KESEHATAN)
// ==========================================

// Get user's examinations
app.get('/api/examinations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type } = req.query;
    const records = await db
      .select()
      .from(healthExaminations)
      .where(eq(healthExaminations.userId, req.user!.id))
      .orderBy(desc(healthExaminations.createdAt));

    const filtered = type ? records.filter((r) => r.type === type) : records;
    res.json(filtered);
  } catch (error: any) {
    console.error('Get examinations error:', error);
    res.status(500).json({ error: 'Gagal memuat catatan pemeriksaan kesehatan' });
  }
});

// Save new examination
app.post('/api/examinations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      type,
      title,
      date,
      time,
      score,
      status,
      category,
      summary,
      answers,
      results,
      recommendations,
      notes,
    } = req.body;

    if (!type || !title || !summary) {
      return res.status(400).json({ error: 'Data pemeriksaan tidak lengkap' });
    }

    const todayDate = date || new Date().toISOString().split('T')[0];
    const currentTime = time || new Date().toTimeString().substring(0, 5);

    const [created] = await db
      .insert(healthExaminations)
      .values({
        userId: req.user!.id,
        type,
        title,
        date: todayDate,
        time: currentTime,
        score: score !== undefined && score !== null ? Number(score) : null,
        status: status || 'Selesai',
        category: category || 'Pemeriksaan Mandiri',
        summary,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers || {}),
        results: typeof results === 'string' ? results : JSON.stringify(results || {}),
        recommendations:
          typeof recommendations === 'string'
            ? recommendations
            : recommendations
            ? JSON.stringify(recommendations)
            : null,
        notes: notes || '',
        createdAt: new Date(),
      })
      .returning();

    // Record system activity for admin dashboard tracking
    try {
      await db.insert(systemActivities).values({
        userId: req.user!.id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'EXAMINATION',
        description: `${req.user!.name} menyelesaikan ${title} (Skor: ${score ?? '-'}, Status: ${status || 'Selesai'})`,
        metadata: JSON.stringify({ examinationId: created.id, type, score }),
        createdAt: new Date(),
      });
    } catch {}

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Save examination error:', error);
    res.status(500).json({ error: 'Gagal menyimpan hasil pemeriksaan ke database' });
  }
});

// Get single examination
app.get('/api/examinations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const records = await db
      .select()
      .from(healthExaminations)
      .where(eq(healthExaminations.id, id))
      .limit(1);

    if (records.length === 0) {
      return res.status(404).json({ error: 'Pemeriksaan tidak ditemukan' });
    }

    const record = records[0];
    if (record.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat detail pemeriksaan' });
  }
});

// Delete examination
app.delete('/api/examinations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(healthExaminations)
      .where(and(eq(healthExaminations.id, id), eq(healthExaminations.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Catatan pemeriksaan tidak ditemukan' });
    }

    res.json({ message: 'Catatan pemeriksaan berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus catatan pemeriksaan' });
  }
});

// Admin: Get all examinations
app.get('/api/admin/examinations', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const exams = await db
      .select({
        id: healthExaminations.id,
        userId: healthExaminations.userId,
        type: healthExaminations.type,
        title: healthExaminations.title,
        date: healthExaminations.date,
        time: healthExaminations.time,
        score: healthExaminations.score,
        status: healthExaminations.status,
        category: healthExaminations.category,
        summary: healthExaminations.summary,
        answers: healthExaminations.answers,
        results: healthExaminations.results,
        recommendations: healthExaminations.recommendations,
        notes: healthExaminations.notes,
        createdAt: healthExaminations.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(healthExaminations)
      .leftJoin(users, eq(healthExaminations.userId, users.id))
      .orderBy(desc(healthExaminations.createdAt));

    res.json(exams);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat rekap pemeriksaan admin' });
  }
});

// ==========================================
// 2. CRUD DATA KESEHATAN (Health Logs)
// ==========================================

app.get('/api/health', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(healthLogs)
      .where(eq(healthLogs.userId, req.user!.id))
      .orderBy(desc(healthLogs.date), desc(healthLogs.time));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat catatan kesehatan' });
  }
});

app.post('/api/health', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date, time, energy, mood, bodyCondition, stomachCondition, stressLevel, notes } = req.body;
    if (!date || !time || energy === undefined || !mood || !bodyCondition || !stomachCondition || stressLevel === undefined) {
      return res.status(400).json({ error: 'Semua bidang data kesehatan wajib diisi' });
    }

    const [created] = await db
      .insert(healthLogs)
      .values({
        userId: req.user!.id,
        date,
        time,
        energy: Number(energy),
        mood,
        bodyCondition,
        stomachCondition,
        stressLevel: Number(stressLevel),
        notes: notes || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyimpan catatan kesehatan' });
  }
});

app.put('/api/health/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { date, time, energy, mood, bodyCondition, stomachCondition, stressLevel, notes } = req.body;

    const [updated] = await db
      .update(healthLogs)
      .set({
        date,
        time,
        energy: Number(energy),
        mood,
        bodyCondition,
        stomachCondition,
        stressLevel: Number(stressLevel),
        notes: notes || '',
      })
      .where(and(eq(healthLogs.id, id), eq(healthLogs.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data kesehatan tidak ditemukan atau bukan milik Anda' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui catatan kesehatan' });
  }
});

app.delete('/api/health/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(healthLogs)
      .where(and(eq(healthLogs.id, id), eq(healthLogs.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data kesehatan tidak ditemukan' });
    }

    res.json({ message: 'Data kesehatan berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data kesehatan' });
  }
});

// ==========================================
// 3. CRUD DATA MAKANAN (Meals)
// ==========================================

app.get('/api/meals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userMeals = await db
      .select()
      .from(meals)
      .where(eq(meals.userId, req.user!.id))
      .orderBy(desc(meals.date), desc(meals.time));

    // Also fetch pre and post meal logs for each meal
    const preLogs = await db
      .select()
      .from(preMealLogs)
      .where(eq(preMealLogs.userId, req.user!.id));

    const postLogs = await db
      .select()
      .from(postMealLogs)
      .where(eq(postMealLogs.userId, req.user!.id));

    const combined = userMeals.map((m) => ({
      ...m,
      preMeal: preLogs.find((p) => p.mealId === m.id) || null,
      postMeal: postLogs.find((p) => p.mealId === m.id) || null,
    }));

    res.json(combined);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat catatan makanan' });
  }
});

app.post('/api/meals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, category, portion, time, date, imageUrl, notes, preMeal, postMeal } = req.body;
    if (!name || !category || !portion || !time || !date) {
      return res.status(400).json({ error: 'Nama makanan, kategori, porsi, waktu, dan tanggal wajib diisi' });
    }

    const [newMeal] = await db
      .insert(meals)
      .values({
        userId: req.user!.id,
        name,
        category,
        portion,
        time,
        date,
        imageUrl: imageUrl || '',
        notes: notes || '',
      })
      .returning();

    let createdPre = null;
    let createdPost = null;

    if (preMeal && preMeal.hungerLevel !== undefined) {
      const [pre] = await db
        .insert(preMealLogs)
        .values({
          userId: req.user!.id,
          mealId: newMeal.id,
          date,
          time,
          hungerLevel: Number(preMeal.hungerLevel),
          energy: Number(preMeal.energy || 5),
          mood: preMeal.mood || 'Netral',
          stomachCondition: preMeal.stomachCondition || 'Normal',
          bodyCondition: preMeal.bodyCondition || 'Biasa',
          notes: preMeal.notes || '',
        })
        .returning();
      createdPre = pre;
    }

    if (postMeal && postMeal.energy !== undefined) {
      const [post] = await db
        .insert(postMealLogs)
        .values({
          userId: req.user!.id,
          mealId: newMeal.id,
          date,
          time: postMeal.time || time,
          energy: Number(postMeal.energy),
          mood: postMeal.mood || 'Baik',
          fullnessLevel: Number(postMeal.fullnessLevel || 7),
          stomachCondition: postMeal.stomachCondition || 'Nyaman',
          isSleepy: Boolean(postMeal.isSleepy),
          isNauseous: Boolean(postMeal.isNauseous),
          isBloated: Boolean(postMeal.isBloated),
          discomfortLevel: Number(postMeal.discomfortLevel || 0),
          notes: postMeal.notes || '',
        })
        .returning();
      createdPost = post;
    }

    res.status(201).json({ ...newMeal, preMeal: createdPre, postMeal: createdPost });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menambahkan makanan' });
  }
});

app.put('/api/meals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, category, portion, time, date, imageUrl, notes } = req.body;

    const [updated] = await db
      .update(meals)
      .set({
        name,
        category,
        portion,
        time,
        date,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        notes: notes || '',
      })
      .where(and(eq(meals.id, id), eq(meals.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Makanan tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui catatan makanan' });
  }
});

app.delete('/api/meals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Makanan tidak ditemukan' });
    }

    res.json({ message: 'Data makanan berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data makanan' });
  }
});

// ==========================================
// 4. CRUD KONDISI SEBELUM MAKAN (Pre-meal)
// ==========================================

app.get('/api/pre-meal', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(preMealLogs)
      .where(eq(preMealLogs.userId, req.user!.id))
      .orderBy(desc(preMealLogs.date), desc(preMealLogs.time));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat kondisi sebelum makan' });
  }
});

app.post('/api/pre-meal', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { mealId, date, time, hungerLevel, energy, mood, stomachCondition, bodyCondition, notes } = req.body;
    if (!date || !time || hungerLevel === undefined || energy === undefined || !mood || !stomachCondition || !bodyCondition) {
      return res.status(400).json({ error: 'Semua kolom kondisi sebelum makan wajib diisi' });
    }

    const [created] = await db
      .insert(preMealLogs)
      .values({
        userId: req.user!.id,
        mealId: mealId ? Number(mealId) : null,
        date,
        time,
        hungerLevel: Number(hungerLevel),
        energy: Number(energy),
        mood,
        stomachCondition,
        bodyCondition,
        notes: notes || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyimpan kondisi sebelum makan' });
  }
});

app.put('/api/pre-meal/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { date, time, hungerLevel, energy, mood, stomachCondition, bodyCondition, notes } = req.body;

    const [updated] = await db
      .update(preMealLogs)
      .set({
        date,
        time,
        hungerLevel: Number(hungerLevel),
        energy: Number(energy),
        mood,
        stomachCondition,
        bodyCondition,
        notes: notes || '',
      })
      .where(and(eq(preMealLogs.id, id), eq(preMealLogs.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data kondisi sebelum makan tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui kondisi sebelum makan' });
  }
});

app.delete('/api/pre-meal/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(preMealLogs)
      .where(and(eq(preMealLogs.id, id), eq(preMealLogs.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    res.json({ message: 'Kondisi sebelum makan berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

// ==========================================
// 5. CRUD KONDISI SETELAH MAKAN (Post-meal)
// ==========================================

app.get('/api/post-meal', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(postMealLogs)
      .where(eq(postMealLogs.userId, req.user!.id))
      .orderBy(desc(postMealLogs.date), desc(postMealLogs.time));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat kondisi setelah makan' });
  }
});

app.post('/api/post-meal', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      mealId,
      date,
      time,
      energy,
      mood,
      fullnessLevel,
      stomachCondition,
      isSleepy,
      isNauseous,
      isBloated,
      discomfortLevel,
      notes,
    } = req.body;

    if (!date || !time || energy === undefined || !mood || fullnessLevel === undefined || !stomachCondition) {
      return res.status(400).json({ error: 'Semua data kondisi setelah makan wajib diisi' });
    }

    const [created] = await db
      .insert(postMealLogs)
      .values({
        userId: req.user!.id,
        mealId: mealId ? Number(mealId) : null,
        date,
        time,
        energy: Number(energy),
        mood,
        fullnessLevel: Number(fullnessLevel),
        stomachCondition,
        isSleepy: Boolean(isSleepy),
        isNauseous: Boolean(isNauseous),
        isBloated: Boolean(isBloated),
        discomfortLevel: Number(discomfortLevel || 0),
        notes: notes || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyimpan kondisi setelah makan' });
  }
});

app.put('/api/post-meal/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const {
      date,
      time,
      energy,
      mood,
      fullnessLevel,
      stomachCondition,
      isSleepy,
      isNauseous,
      isBloated,
      discomfortLevel,
      notes,
    } = req.body;

    const [updated] = await db
      .update(postMealLogs)
      .set({
        date,
        time,
        energy: Number(energy),
        mood,
        fullnessLevel: Number(fullnessLevel),
        stomachCondition,
        isSleepy: Boolean(isSleepy),
        isNauseous: Boolean(isNauseous),
        isBloated: Boolean(isBloated),
        discomfortLevel: Number(discomfortLevel || 0),
        notes: notes || '',
      })
      .where(and(eq(postMealLogs.id, id), eq(postMealLogs.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data kondisi setelah makan tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui kondisi setelah makan' });
  }
});

app.delete('/api/post-meal/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(postMealLogs)
      .where(and(eq(postMealLogs.id, id), eq(postMealLogs.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    res.json({ message: 'Kondisi setelah makan berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

// ==========================================
// 6. CRUD DATA GEJALA (Symptoms)
// ==========================================

app.get('/api/symptoms', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.userId, req.user!.id))
      .orderBy(desc(symptoms.date), desc(symptoms.time));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat data gejala' });
  }
});

app.post('/api/symptoms', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, intensity, date, time, duration, notes } = req.body;
    if (!name || intensity === undefined || !date || !time || !duration) {
      return res.status(400).json({ error: 'Nama gejala, intensitas, tanggal, waktu, dan durasi wajib diisi' });
    }

    const [created] = await db
      .insert(symptoms)
      .values({
        userId: req.user!.id,
        name,
        intensity: Number(intensity),
        date,
        time,
        duration,
        notes: notes || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyimpan data gejala' });
  }
});

app.put('/api/symptoms/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, intensity, date, time, duration, notes } = req.body;

    const [updated] = await db
      .update(symptoms)
      .set({
        name,
        intensity: Number(intensity),
        date,
        time,
        duration,
        notes: notes || '',
      })
      .where(and(eq(symptoms.id, id), eq(symptoms.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data gejala tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui data gejala' });
  }
});

app.delete('/api/symptoms/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(symptoms)
      .where(and(eq(symptoms.id, id), eq(symptoms.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data gejala tidak ditemukan' });
    }

    res.json({ message: 'Data gejala berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data gejala' });
  }
});

// ==========================================
// 7. CRUD DATA TIDUR (Sleep Logs)
// ==========================================

app.get('/api/sleep', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(sleepLogs)
      .where(eq(sleepLogs.userId, req.user!.id))
      .orderBy(desc(sleepLogs.date));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat riwayat tidur' });
  }
});

app.post('/api/sleep', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date, sleepTime, wakeTime, durationHours, quality, notes } = req.body;
    if (!date || !sleepTime || !wakeTime || durationHours === undefined || quality === undefined) {
      return res.status(400).json({ error: 'Tanggal, jam tidur, jam bangun, durasi, dan kualitas wajib diisi' });
    }

    const [created] = await db
      .insert(sleepLogs)
      .values({
        userId: req.user!.id,
        date,
        sleepTime,
        wakeTime,
        durationHours: Number(durationHours),
        quality: Number(quality),
        notes: notes || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyimpan catatan tidur' });
  }
});

app.put('/api/sleep/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { date, sleepTime, wakeTime, durationHours, quality, notes } = req.body;

    const [updated] = await db
      .update(sleepLogs)
      .set({
        date,
        sleepTime,
        wakeTime,
        durationHours: Number(durationHours),
        quality: Number(quality),
        notes: notes || '',
      })
      .where(and(eq(sleepLogs.id, id), eq(sleepLogs.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data tidur tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui catatan tidur' });
  }
});

app.delete('/api/sleep/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(sleepLogs)
      .where(and(eq(sleepLogs.id, id), eq(sleepLogs.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data tidur tidak ditemukan' });
    }

    res.json({ message: 'Data tidur berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data tidur' });
  }
});

// ==========================================
// 8. CRUD DATA AKTIVITAS (Activity Logs)
// ==========================================

app.get('/api/activity', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, req.user!.id))
      .orderBy(desc(activityLogs.date), desc(activityLogs.time));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat catatan aktivitas' });
  }
});

app.post('/api/activity', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { activityName, durationMinutes, intensity, date, time, notes } = req.body;
    if (!activityName || durationMinutes === undefined || !intensity || !date || !time) {
      return res.status(400).json({ error: 'Nama aktivitas, durasi, intensitas, tanggal, dan jam wajib diisi' });
    }

    const [created] = await db
      .insert(activityLogs)
      .values({
        userId: req.user!.id,
        activityName,
        durationMinutes: Number(durationMinutes),
        intensity,
        date,
        time,
        notes: notes || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyimpan catatan aktivitas' });
  }
});

app.put('/api/activity/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { activityName, durationMinutes, intensity, date, time, notes } = req.body;

    const [updated] = await db
      .update(activityLogs)
      .set({
        activityName,
        durationMinutes: Number(durationMinutes),
        intensity,
        date,
        time,
        notes: notes || '',
      })
      .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data aktivitas tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui catatan aktivitas' });
  }
});

app.delete('/api/activity/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(activityLogs)
      .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data aktivitas tidak ditemukan' });
    }

    res.json({ message: 'Data aktivitas berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data aktivitas' });
  }
});

// ==========================================
// 9. CRUD DATA HIDRASI (Hydration Logs)
// ==========================================

app.get('/api/hydration', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db
      .select()
      .from(hydrationLogs)
      .where(eq(hydrationLogs.userId, req.user!.id))
      .orderBy(desc(hydrationLogs.date), desc(hydrationLogs.time));
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat catatan hidrasi' });
  }
});

app.post('/api/hydration', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { amountMl, date, time, notes } = req.body;
    if (amountMl === undefined || !date || !time) {
      return res.status(400).json({ error: 'Jumlah air (ml), tanggal, dan waktu wajib diisi' });
    }

    const [created] = await db
      .insert(hydrationLogs)
      .values({
        userId: req.user!.id,
        amountMl: Number(amountMl),
        date,
        time,
        notes: notes || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyimpan catatan hidrasi' });
  }
});

app.put('/api/hydration/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { amountMl, date, time, notes } = req.body;

    const [updated] = await db
      .update(hydrationLogs)
      .set({
        amountMl: Number(amountMl),
        date,
        time,
        notes: notes || '',
      })
      .where(and(eq(hydrationLogs.id, id), eq(hydrationLogs.userId, req.user!.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Data hidrasi tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui catatan hidrasi' });
  }
});

app.delete('/api/hydration/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db
      .delete(hydrationLogs)
      .where(and(eq(hydrationLogs.id, id), eq(hydrationLogs.userId, req.user!.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data hidrasi tidak ditemukan' });
    }

    res.json({ message: 'Data hidrasi berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus data hidrasi' });
  }
});

// ==========================================
// 10. REKAP LAPORAN & FILTER LAPORAN
// ==========================================

app.get('/api/reports/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { period, startDate, endDate, category } = req.query;

    const now = new Date();
    let computedStart = '';
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      computedStart = todayStr;
    } else if (period === '7d' || !period) {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      computedStart = d.toISOString().split('T')[0];
    } else if (period === '30d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      computedStart = d.toISOString().split('T')[0];
    } else if (period === '3m') {
      const d = new Date(now);
      d.setDate(d.getDate() - 89);
      computedStart = d.toISOString().split('T')[0];
    } else if (period === 'custom') {
      computedStart = (startDate as string) || todayStr;
    }

    const computedEnd = period === 'custom' && endDate ? (endDate as string) : todayStr;

    // Fetch records in range
    const [allHealth, allMeals, allPreMeals, allPostMeals, allSymptoms, allSleep, allActivities, allHydration] =
      await Promise.all([
        db
          .select()
          .from(healthLogs)
          .where(
            and(
              eq(healthLogs.userId, userId),
              gte(healthLogs.date, computedStart),
              lte(healthLogs.date, computedEnd)
            )
          )
          .orderBy(healthLogs.date, healthLogs.time),
        db
          .select()
          .from(meals)
          .where(
            and(
              eq(meals.userId, userId),
              gte(meals.date, computedStart),
              lte(meals.date, computedEnd)
            )
          )
          .orderBy(meals.date, meals.time),
        db
          .select()
          .from(preMealLogs)
          .where(
            and(
              eq(preMealLogs.userId, userId),
              gte(preMealLogs.date, computedStart),
              lte(preMealLogs.date, computedEnd)
            )
          )
          .orderBy(preMealLogs.date, preMealLogs.time),
        db
          .select()
          .from(postMealLogs)
          .where(
            and(
              eq(postMealLogs.userId, userId),
              gte(postMealLogs.date, computedStart),
              lte(postMealLogs.date, computedEnd)
            )
          )
          .orderBy(postMealLogs.date, postMealLogs.time),
        db
          .select()
          .from(symptoms)
          .where(
            and(
              eq(symptoms.userId, userId),
              gte(symptoms.date, computedStart),
              lte(symptoms.date, computedEnd)
            )
          )
          .orderBy(symptoms.date, symptoms.time),
        db
          .select()
          .from(sleepLogs)
          .where(
            and(
              eq(sleepLogs.userId, userId),
              gte(sleepLogs.date, computedStart),
              lte(sleepLogs.date, computedEnd)
            )
          )
          .orderBy(sleepLogs.date),
        db
          .select()
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.userId, userId),
              gte(activityLogs.date, computedStart),
              lte(activityLogs.date, computedEnd)
            )
          )
          .orderBy(activityLogs.date, activityLogs.time),
        db
          .select()
          .from(hydrationLogs)
          .where(
            and(
              eq(hydrationLogs.userId, userId),
              gte(hydrationLogs.date, computedStart),
              lte(hydrationLogs.date, computedEnd)
            )
          )
          .orderBy(hydrationLogs.date, hydrationLogs.time),
      ]);

    // Distinct dates recorded
    const uniqueDays = new Set([
      ...allHealth.map((h) => h.date),
      ...allMeals.map((m) => m.date),
      ...allSymptoms.map((s) => s.date),
      ...allSleep.map((sl) => sl.date),
      ...allActivities.map((a) => a.date),
    ]);

    // 1. Health Recap
    const totalHealthChecks = allHealth.length;
    const avgEnergy = totalHealthChecks
      ? Number((allHealth.reduce((acc, h) => acc + h.energy, 0) / totalHealthChecks).toFixed(1))
      : 0;
    const avgStress = totalHealthChecks
      ? Number((allHealth.reduce((acc, h) => acc + h.stressLevel, 0) / totalHealthChecks).toFixed(1))
      : 0;

    // Mood distribution
    const moodCounts: Record<string, number> = {};
    allHealth.forEach((h) => {
      moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1;
    });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Netral';

    // 2. Meal Recap
    const totalMeals = allMeals.length;
    const breakfastCount = allMeals.filter((m) => m.category.toLowerCase().includes('sarapan')).length;
    const lunchCount = allMeals.filter((m) => m.category.toLowerCase().includes('siang')).length;
    const dinnerCount = allMeals.filter((m) => m.category.toLowerCase().includes('malam')).length;
    const snackCount = allMeals.filter((m) => m.category.toLowerCase().includes('snack') || m.category.toLowerCase().includes('camilan')).length;

    // Most frequent meals
    const mealFrequency: Record<string, number> = {};
    allMeals.forEach((m) => {
      mealFrequency[m.name] = (mealFrequency[m.name] || 0) + 1;
    });
    const mostFrequentMeals = Object.entries(mealFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 3. Post-Meal Recap
    const totalPostMeals = allPostMeals.length;
    const bloatingCount = allPostMeals.filter((p) => p.isBloated).length;
    const nauseaCount = allPostMeals.filter((p) => p.isNauseous).length;
    const sleepyCount = allPostMeals.filter((p) => p.isSleepy).length;
    const avgPostEnergy = totalPostMeals
      ? Number((allPostMeals.reduce((acc, p) => acc + p.energy, 0) / totalPostMeals).toFixed(1))
      : 0;
    const avgFullness = totalPostMeals
      ? Number((allPostMeals.reduce((acc, p) => acc + p.fullnessLevel, 0) / totalPostMeals).toFixed(1))
      : 0;

    // 4. Sleep Recap
    const totalSleepRecords = allSleep.length;
    const avgSleepDuration = totalSleepRecords
      ? Number((allSleep.reduce((acc, s) => acc + s.durationHours, 0) / totalSleepRecords).toFixed(1))
      : 0;
    const avgSleepQuality = totalSleepRecords
      ? Number((allSleep.reduce((acc, s) => acc + s.quality, 0) / totalSleepRecords).toFixed(1))
      : 0;

    // 5. Activity Recap
    const totalActivities = allActivities.length;
    const totalActivityDuration = allActivities.reduce((acc, a) => acc + a.durationMinutes, 0);

    // 6. Symptoms Recap
    const totalSymptoms = allSymptoms.length;
    const symptomFrequency: Record<string, number> = {};
    allSymptoms.forEach((s) => {
      symptomFrequency[s.name] = (symptomFrequency[s.name] || 0) + 1;
    });
    const mostFrequentSymptoms = Object.entries(symptomFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    const avgSymptomIntensity = totalSymptoms
      ? Number((allSymptoms.reduce((acc, s) => acc + s.intensity, 0) / totalSymptoms).toFixed(1))
      : 0;

    // 7. Hydration Recap
    const totalHydrationMl = allHydration.reduce((acc, h) => acc + h.amountMl, 0);
    const avgDailyHydrationMl = uniqueDays.size > 0 ? Math.round(totalHydrationMl / uniqueDays.size) : totalHydrationMl;

    // 8. Recharts Datasets Preparation
    // Energy Trend
    const energyTrend = allHealth.map((h) => ({
      date: h.date,
      time: h.time,
      energy: h.energy,
      stress: h.stressLevel,
    }));

    // Mood Trend (Mapped to numeric score for line chart visualization + label)
    const moodScoreMap: Record<string, number> = {
      'Sangat Baik': 5,
      'Baik': 4,
      'Netral': 3,
      'Cemas': 2,
      'Buruk': 2,
      'Sangat Buruk': 1,
    };
    const moodTrend = allHealth.map((h) => ({
      date: h.date,
      time: h.time,
      moodScore: moodScoreMap[h.mood] || 3,
      mood: h.mood,
    }));

    // Sleep Bar Chart
    const sleepBarChart = allSleep.map((s) => ({
      date: s.date,
      duration: s.durationHours,
      quality: s.quality,
    }));

    // Activity Bar Chart
    const activityBarChart = allActivities.map((a) => ({
      date: a.date,
      name: a.activityName,
      duration: a.durationMinutes,
      intensity: a.intensity,
    }));

    // Post-Meal Condition Chart
    const postMealChart = allPostMeals.map((p) => ({
      date: p.date,
      time: p.time,
      energy: p.energy,
      fullness: p.fullnessLevel,
      discomfort: p.discomfortLevel,
    }));

    // Food Category Distribution (Pie / Donut chart)
    const mealCategoryDistribution = [
      { name: 'Sarapan', value: breakfastCount },
      { name: 'Makan Siang', value: lunchCount },
      { name: 'Makan Malam', value: dinnerCount },
      { name: 'Snack', value: snackCount },
    ].filter((item) => item.value > 0);

    res.json({
      period: {
        type: period || '7d',
        startDate: computedStart,
        endDate: computedEnd,
      },
      summary: {
        totalDaysRecorded: uniqueDays.size,
        health: {
          totalChecks: totalHealthChecks,
          avgEnergy,
          avgStress,
          dominantMood,
          symptomsCount: totalSymptoms,
        },
        meals: {
          totalMeals,
          breakfastCount,
          lunchCount,
          dinnerCount,
          snackCount,
          mostFrequentMeals,
        },
        postMeal: {
          totalFollowUps: totalPostMeals,
          avgEnergy: avgPostEnergy,
          avgFullness,
          bloatingCount,
          nauseaCount,
          sleepyCount,
        },
        sleep: {
          totalRecords: totalSleepRecords,
          avgDuration: avgSleepDuration,
          avgQuality: avgSleepQuality,
        },
        activity: {
          totalActivities,
          totalDurationMinutes: totalActivityDuration,
        },
        symptoms: {
          totalSymptoms,
          avgIntensity: avgSymptomIntensity,
          mostFrequentSymptoms,
        },
        hydration: {
          totalHydrationMl,
          avgDailyHydrationMl,
        },
      },
      charts: {
        energyTrend,
        moodTrend,
        sleepBarChart,
        activityBarChart,
        postMealChart,
        mealCategoryDistribution,
      },
      rawLogs: {
        health: allHealth,
        meals: allMeals,
        preMeal: allPreMeals,
        postMeal: allPostMeals,
        symptoms: allSymptoms,
        sleep: allSleep,
        activity: allActivities,
        hydration: allHydration,
      },
    });
  } catch (error: any) {
    console.error('Reports summary error:', error);
    res.status(500).json({ error: 'Gagal memuat rekap laporan' });
  }
});

// ==========================================
// 11. ADMIN DASHBOARD & AGGREGATE REPORTS (REAL LIVE USER DATA)
// ==========================================

app.get('/api/admin/reports', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const period = (req.query.period as string) || 'all';
    const now = new Date();
    let startDate: string | null = null;
    const endDate = now.toISOString().split('T')[0];

    if (period === 'today') {
      startDate = endDate;
    } else if (period === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      startDate = d.toISOString().split('T')[0];
    } else if (period === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      startDate = d.toISOString().split('T')[0];
    } else if (period === '90d') {
      const d = new Date();
      d.setDate(d.getDate() - 89);
      startDate = d.toISOString().split('T')[0];
    }

    // 1. User base statistics
    const [allUsersList, activeUsersCount] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true)),
    ]);

    const totalUsers = allUsersList.length;
    const activeUsers = Number(activeUsersCount[0]?.count || 0);

    // 2. Fetch all modules data (respecting period filter if specified)
    const [
      allHealth,
      allMeals,
      allSymptoms,
      allSleep,
      allActivities,
      allHydration,
    ] = await Promise.all([
      startDate
        ? db.select().from(healthLogs).where(and(gte(healthLogs.date, startDate), lte(healthLogs.date, endDate))).orderBy(desc(healthLogs.date), desc(healthLogs.time))
        : db.select().from(healthLogs).orderBy(desc(healthLogs.date), desc(healthLogs.time)),
      startDate
        ? db.select().from(meals).where(and(gte(meals.date, startDate), lte(meals.date, endDate))).orderBy(desc(meals.date), desc(meals.time))
        : db.select().from(meals).orderBy(desc(meals.date), desc(meals.time)),
      startDate
        ? db.select().from(symptoms).where(and(gte(symptoms.date, startDate), lte(symptoms.date, endDate))).orderBy(desc(symptoms.date), desc(symptoms.time))
        : db.select().from(symptoms).orderBy(desc(symptoms.date), desc(symptoms.time)),
      startDate
        ? db.select().from(sleepLogs).where(and(gte(sleepLogs.date, startDate), lte(sleepLogs.date, endDate))).orderBy(desc(sleepLogs.date))
        : db.select().from(sleepLogs).orderBy(desc(sleepLogs.date)),
      startDate
        ? db.select().from(activityLogs).where(and(gte(activityLogs.date, startDate), lte(activityLogs.date, endDate))).orderBy(desc(activityLogs.date), desc(activityLogs.time))
        : db.select().from(activityLogs).orderBy(desc(activityLogs.date), desc(activityLogs.time)),
      startDate
        ? db.select().from(hydrationLogs).where(and(gte(hydrationLogs.date, startDate), lte(hydrationLogs.date, endDate))).orderBy(desc(hydrationLogs.date), desc(hydrationLogs.time))
        : db.select().from(hydrationLogs).orderBy(desc(hydrationLogs.date), desc(hydrationLogs.time)),
    ]);

    const totalMeals = allMeals.length;
    const totalHealthChecks = allHealth.length;
    const totalSymptoms = allSymptoms.length;
    const totalSleep = allSleep.length;
    const totalActivity = allActivities.length;
    const totalHydration = allHydration.length;
    const totalLogs = totalMeals + totalHealthChecks + totalSymptoms + totalSleep + totalActivity + totalHydration;

    // Averages from real data
    const avgEnergy = totalHealthChecks
      ? Number((allHealth.reduce((acc, h) => acc + h.energy, 0) / totalHealthChecks).toFixed(1))
      : 0;
    const avgStress = totalHealthChecks
      ? Number((allHealth.reduce((acc, h) => acc + h.stressLevel, 0) / totalHealthChecks).toFixed(1))
      : 0;
    const avgSleepDuration = totalSleep
      ? Number((allSleep.reduce((acc, s) => acc + s.durationHours, 0) / totalSleep).toFixed(1))
      : 0;
    const avgSleepQuality = totalSleep
      ? Number((allSleep.reduce((acc, s) => acc + s.quality, 0) / totalSleep).toFixed(1))
      : 0;

    // Feature Usage Breakdown
    const featureUsage = [
      { feature: 'Catatan Makanan', count: totalMeals },
      { feature: 'Health Check', count: totalHealthChecks },
      { feature: 'Catatan Gejala', count: totalSymptoms },
      { feature: 'Pola Tidur', count: totalSleep },
      { feature: 'Aktivitas Fisik', count: totalActivity },
      { feature: 'Catatan Hidrasi', count: totalHydration },
    ];

    // Meal Category Distribution
    const breakfastCount = allMeals.filter((m) => m.category.toLowerCase().includes('sarapan')).length;
    const lunchCount = allMeals.filter((m) => m.category.toLowerCase().includes('siang')).length;
    const dinnerCount = allMeals.filter((m) => m.category.toLowerCase().includes('malam')).length;
    const snackCount = allMeals.filter((m) => m.category.toLowerCase().includes('snack') || m.category.toLowerCase().includes('camilan')).length;
    const mealCategoryDistribution = [
      { name: 'Sarapan', value: breakfastCount },
      { name: 'Makan Siang', value: lunchCount },
      { name: 'Makan Malam', value: dinnerCount },
      { name: 'Snack / Camilan', value: snackCount },
    ].filter((item) => item.value > 0);

    // Top Meals logged by users
    const mealFrequency: Record<string, { count: number; category: string }> = {};
    allMeals.forEach((m) => {
      if (!mealFrequency[m.name]) {
        mealFrequency[m.name] = { count: 1, category: m.category };
      } else {
        mealFrequency[m.name].count += 1;
      }
    });
    const topMeals = Object.entries(mealFrequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, info]) => ({ name, count: info.count, category: info.category }));

    // Top Symptoms reported by users
    const symptomFreq: Record<string, { count: number; totalIntensity: number }> = {};
    allSymptoms.forEach((s) => {
      if (!symptomFreq[s.name]) {
        symptomFreq[s.name] = { count: 1, totalIntensity: s.intensity };
      } else {
        symptomFreq[s.name].count += 1;
        symptomFreq[s.name].totalIntensity += s.intensity;
      }
    });
    const topSymptoms = Object.entries(symptomFreq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, info]) => ({
        name,
        count: info.count,
        avgIntensity: Number((info.totalIntensity / info.count).toFixed(1)),
      }));

    // 3. User Recap Table (Real user activity & contribution)
    const userRecap = allUsersList.map((u) => {
      const userMeals = allMeals.filter((m) => m.userId === u.id);
      const userHealth = allHealth.filter((h) => h.userId === u.id);
      const userSymptoms = allSymptoms.filter((s) => s.userId === u.id);
      const userSleep = allSleep.filter((sl) => sl.userId === u.id);
      const userActivities = allActivities.filter((a) => a.userId === u.id);
      const userHydration = allHydration.filter((hy) => hy.userId === u.id);

      const allDates = [
        ...userMeals.map((m) => m.date),
        ...userHealth.map((h) => h.date),
        ...userSymptoms.map((s) => s.date),
        ...userSleep.map((sl) => sl.date),
        ...userActivities.map((a) => a.date),
        ...userHydration.map((hy) => hy.date),
      ].filter(Boolean);

      allDates.sort().reverse();
      const lastActive = allDates[0] || (u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '-');

      const totalUserLogs =
        userMeals.length +
        userHealth.length +
        userSymptoms.length +
        userSleep.length +
        userActivities.length +
        userHydration.length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        mealCount: userMeals.length,
        healthCount: userHealth.length,
        symptomCount: userSymptoms.length,
        sleepCount: userSleep.length,
        activityCount: userActivities.length,
        hydrationCount: userHydration.length,
        totalLogs: totalUserLogs,
        lastActive,
      };
    });

    // 4. Live Recent Activities Stream (Real items recently logged across the platform)
    const userMap = new Map<number, { name: string; email: string }>();
    allUsersList.forEach((u) => userMap.set(u.id, { name: u.name, email: u.email }));

    const activitiesList: Array<{
      id: string;
      module: 'meal' | 'health' | 'symptom' | 'sleep' | 'activity' | 'hydration';
      userName: string;
      userEmail: string;
      title: string;
      detail: string;
      date: string;
      time: string;
      createdAt: Date;
    }> = [];

    // Recent meals
    allMeals.slice(0, 10).forEach((m) => {
      const u = userMap.get(m.userId);
      activitiesList.push({
        id: `meal-${m.id}`,
        module: 'meal',
        userName: u?.name || 'Pengguna',
        userEmail: u?.email || '',
        title: `Mencatat Menu: ${m.name}`,
        detail: `Kategori: ${m.category} • Porsi: ${m.portion}`,
        date: m.date,
        time: m.time,
        createdAt: m.createdAt,
      });
    });

    // Recent health checks
    allHealth.slice(0, 10).forEach((h) => {
      const u = userMap.get(h.userId);
      activitiesList.push({
        id: `health-${h.id}`,
        module: 'health',
        userName: u?.name || 'Pengguna',
        userEmail: u?.email || '',
        title: `Health Check: Energi ${h.energy}/10`,
        detail: `Mood: ${h.mood} • Kondisi Perut: ${h.stomachCondition}`,
        date: h.date,
        time: h.time,
        createdAt: h.createdAt,
      });
    });

    // Recent symptoms
    allSymptoms.slice(0, 10).forEach((s) => {
      const u = userMap.get(s.userId);
      activitiesList.push({
        id: `symptom-${s.id}`,
        module: 'symptom',
        userName: u?.name || 'Pengguna',
        userEmail: u?.email || '',
        title: `Keluhan Gejala: ${s.name}`,
        detail: `Intensitas: ${s.intensity}/10 • Durasi: ${s.duration}`,
        date: s.date,
        time: s.time,
        createdAt: s.createdAt,
      });
    });

    // Recent sleep
    allSleep.slice(0, 10).forEach((sl) => {
      const u = userMap.get(sl.userId);
      activitiesList.push({
        id: `sleep-${sl.id}`,
        module: 'sleep',
        userName: u?.name || 'Pengguna',
        userEmail: u?.email || '',
        title: `Catatan Tidur: ${sl.durationHours} Jam`,
        detail: `Tidur: ${sl.sleepTime} - Bangun: ${sl.wakeTime} • Kualitas: ${sl.quality}/5`,
        date: sl.date,
        time: sl.wakeTime,
        createdAt: sl.createdAt,
      });
    });

    // Recent activities
    allActivities.slice(0, 10).forEach((a) => {
      const u = userMap.get(a.userId);
      activitiesList.push({
        id: `activity-${a.id}`,
        module: 'activity',
        userName: u?.name || 'Pengguna',
        userEmail: u?.email || '',
        title: `Aktivitas Fisik: ${a.activityName}`,
        detail: `Durasi: ${a.durationMinutes} menit • Intensitas: ${a.intensity}`,
        date: a.date,
        time: a.time,
        createdAt: a.createdAt,
      });
    });

    // Sort combined activities by createdAt descending, limit to 20
    activitiesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivities = activitiesList.slice(0, 20);

    res.json({
      period: {
        type: period,
        startDate: startDate || 'Semua Waktu',
        endDate,
      },
      aggregate: {
        totalUsers,
        activeUsers,
        totalMeals,
        totalHealthChecks,
        totalSymptoms,
        totalSleep,
        totalActivity,
        totalHydration,
        totalLogs,
        avgEnergy,
        avgStress,
        avgSleepDuration,
        avgSleepQuality,
      },
      featureUsage,
      mealCategoryDistribution,
      topMeals,
      topSymptoms,
      userRecap,
      recentUsers: allUsersList.slice(0, 10),
      recentActivities,
    });
  } catch (error: any) {
    console.error('Admin reports error:', error);
    res.status(500).json({ error: 'Gagal memuat rekap laporan admin' });
  }
});

// ==========================================
// 12. ADMIN CRUD: USERS (WITH REAL STATS PER USER)
// ==========================================

app.get('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Fetch counts per user
    const [
      mealCounts,
      healthCounts,
      symptomCounts,
      sleepCounts,
      activityCounts,
    ] = await Promise.all([
      db.select({ userId: meals.userId, count: sql<number>`count(*)` }).from(meals).groupBy(meals.userId),
      db.select({ userId: healthLogs.userId, count: sql<number>`count(*)` }).from(healthLogs).groupBy(healthLogs.userId),
      db.select({ userId: symptoms.userId, count: sql<number>`count(*)` }).from(symptoms).groupBy(symptoms.userId),
      db.select({ userId: sleepLogs.userId, count: sql<number>`count(*)` }).from(sleepLogs).groupBy(sleepLogs.userId),
      db.select({ userId: activityLogs.userId, count: sql<number>`count(*)` }).from(activityLogs).groupBy(activityLogs.userId),
    ]);

    const mealsMap = new Map<number, number>();
    mealCounts.forEach((r) => mealsMap.set(r.userId, Number(r.count)));

    const healthMap = new Map<number, number>();
    healthCounts.forEach((r) => healthMap.set(r.userId, Number(r.count)));

    const symptomsMap = new Map<number, number>();
    symptomCounts.forEach((r) => symptomsMap.set(r.userId, Number(r.count)));

    const sleepMap = new Map<number, number>();
    sleepCounts.forEach((r) => sleepMap.set(r.userId, Number(r.count)));

    const activityMap = new Map<number, number>();
    activityCounts.forEach((r) => activityMap.set(r.userId, Number(r.count)));

    const enrichedUsers = allUsers.map((u) => {
      const userMeals = mealsMap.get(u.id) || 0;
      const userHealth = healthMap.get(u.id) || 0;
      const userSymptoms = symptomsMap.get(u.id) || 0;
      const userSleep = sleepMap.get(u.id) || 0;
      const userActivity = activityMap.get(u.id) || 0;
      const totalRecords = userMeals + userHealth + userSymptoms + userSleep + userActivity;

      return {
        ...u,
        totalMeals: userMeals,
        totalHealthChecks: userHealth,
        totalSymptoms: userSymptoms,
        totalSleep: userSleep,
        totalActivity: userActivity,
        totalRecords,
      };
    });

    res.json(enrichedUsers);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat daftar pengguna' });
  }
});

app.post('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const [newUser] = await db
      .insert(users)
      .values({
        uid: userUid,
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .returning({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal membuat pengguna baru' });
  }
});

app.put('/api/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, role, isActive, password } = req.body;

    const updateData: any = {
      name,
      email: email?.toLowerCase().trim(),
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      isActive: Boolean(isActive),
      updatedAt: new Date(),
    };

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    if (!updated) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui pengguna' });
  }
});

app.patch('/api/admin/users/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;

    const [updated] = await db
      .update(users)
      .set({ isActive: Boolean(isActive), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        isActive: users.isActive,
      });

    if (!updated) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui status pengguna' });
  }
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    const deleted = await db.delete(users).where(eq(users.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
});

// ==========================================
// 13. ADMIN CRUD: DATABASE MAKANAN (Food Database)
// ==========================================

app.get('/api/admin/foods', requireAuth, async (req: AuthRequest, res) => {
  try {
    const foods = await db.select().from(foodDatabase).orderBy(desc(foodDatabase.createdAt));
    res.json(foods);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat database makanan' });
  }
});

app.post('/api/admin/foods', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, category, calories, protein, carbs, fat, standardPortion, description } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: 'Nama dan kategori makanan wajib diisi' });
    }

    const [created] = await db
      .insert(foodDatabase)
      .values({
        name,
        category,
        calories: Number(calories || 0),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fat: Number(fat || 0),
        standardPortion: standardPortion || '1 Porsi',
        description: description || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menambahkan makanan ke database' });
  }
});

app.put('/api/admin/foods/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, category, calories, protein, carbs, fat, standardPortion, description } = req.body;

    const [updated] = await db
      .update(foodDatabase)
      .set({
        name,
        category,
        calories: Number(calories || 0),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fat: Number(fat || 0),
        standardPortion: standardPortion || '1 Porsi',
        description: description || '',
      })
      .where(eq(foodDatabase.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Makanan tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui makanan' });
  }
});

app.delete('/api/admin/foods/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(foodDatabase).where(eq(foodDatabase.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Makanan tidak ditemukan' });
    }
    res.json({ message: 'Makanan berhasil dihapus dari database' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus makanan' });
  }
});

// ==========================================
// 14. ADMIN CRUD: ARTIKEL EDUKASI
// ==========================================

app.get('/api/admin/articles', requireAuth, async (req: AuthRequest, res) => {
  try {
    const articles = await db.select().from(educationArticles).orderBy(desc(educationArticles.createdAt));
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat artikel edukasi' });
  }
});

app.post('/api/admin/articles', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, category, summary, content, author, readTime, isPublished } = req.body;
    if (!title || !category || !summary || !content) {
      return res.status(400).json({ error: 'Judul, kategori, ringkasan, dan isi artikel wajib diisi' });
    }

    const [created] = await db
      .insert(educationArticles)
      .values({
        title,
        category,
        summary,
        content,
        author: author || 'Tim MedikaCheck',
        readTime: readTime || '3 min read',
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal membuat artikel edukasi' });
  }
});

app.put('/api/admin/articles/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { title, category, summary, content, author, readTime, isPublished } = req.body;

    const [updated] = await db
      .update(educationArticles)
      .set({
        title,
        category,
        summary,
        content,
        author: author || 'Tim MedikaCheck',
        readTime: readTime || '3 min read',
        isPublished: Boolean(isPublished),
      })
      .where(eq(educationArticles.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui artikel' });
  }
});

app.delete('/api/admin/articles/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(educationArticles).where(eq(educationArticles.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan' });
    }
    res.json({ message: 'Artikel berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus artikel' });
  }
});

// ==========================================
// 15. ADMIN CRUD: KATEGORI
// ==========================================

app.get('/api/admin/categories', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allCategories = await db.select().from(categories).orderBy(categories.name);
    res.json(allCategories);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat kategori' });
  }
});

app.post('/api/admin/categories', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, type, description } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Nama dan tipe kategori wajib diisi' });
    }

    const [created] = await db
      .insert(categories)
      .values({
        name,
        type,
        description: description || '',
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal membuat kategori' });
  }
});

app.put('/api/admin/categories/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, type, description } = req.body;

    const [updated] = await db
      .update(categories)
      .set({
        name,
        type,
        description: description || '',
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui kategori' });
  }
});

app.delete('/api/admin/categories/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus kategori' });
  }
});

// ==========================================
// 16. ADMIN CRUD: NOTIFIKASI
// ==========================================

app.get('/api/admin/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    // If user is admin, show all; if normal user, show active notifications for USER or ALL
    if (req.user?.role === 'ADMIN') {
      const allNotifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
      return res.json(allNotifs);
    }

    const userNotifs = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.isActive, true),
          sql`${notifications.targetRole} IN ('ALL', 'USER')`
        )
      )
      .orderBy(desc(notifications.createdAt));

    res.json(userNotifs);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat notifikasi' });
  }
});

app.post('/api/admin/notifications', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, message, targetRole, type, isActive } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Judul dan pesan notifikasi wajib diisi' });
    }

    const [created] = await db
      .insert(notifications)
      .values({
        title,
        message,
        targetRole: targetRole || 'ALL',
        type: type || 'INFO',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal membuat notifikasi' });
  }
});

app.put('/api/admin/notifications/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { title, message, targetRole, type, isActive } = req.body;

    const [updated] = await db
      .update(notifications)
      .set({
        title,
        message,
        targetRole: targetRole || 'ALL',
        type: type || 'INFO',
        isActive: Boolean(isActive),
      })
      .where(eq(notifications.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui notifikasi' });
  }
});

app.delete('/api/admin/notifications/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }
    res.json({ message: 'Notifikasi berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus notifikasi' });
  }
});

// Ensure unmatched /api routes return JSON 404 instead of HTML
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
});

// Ensure /api routes always return structured JSON errors (never HTML error pages)
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err?.message || 'Terjadi kesalahan pada server saat memproses permintaan.',
  });
});

// ==========================================
// VITE DEV SERVER / STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`MedikaCheck Server running on port ${PORT}`);
  });
}

startServer();
