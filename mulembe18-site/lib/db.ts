import mysql from "mysql2/promise";
import kenyaHierarchyData from "./data/kenya-hierarchy.json";

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.TIDB_HOST || "gateway01.ap-northeast-1.prod.aws.tidbcloud.com",
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER || "4Cqp3QYorpBTz6H.root",
      password: process.env.TIDB_PASSWORD || "OkOeQnMkcKs4hj6R",
      database: process.env.TIDB_DATABASE || "mulembe18",
      ssl: {
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const db = getDbPool();
    const [rows] = await db.execute(sql, params);
    return rows as T[];
  } catch (error: any) {
    console.warn("[TiDB / MySQL] Query execution error:", error?.message || error);
    throw error;
  }
}

/**
 * Initializes required production schema in TiDB / MySQL
 */
export async function initDatabaseSchema() {
  try {
    const db = getDbPool();

    // 1. Members Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clerk_id VARCHAR(191) NULL UNIQUE,
        full_name VARCHAR(191) NOT NULL,
        email VARCHAR(191) NULL,
        phone VARCHAR(60) NOT NULL,
        sub_clan VARCHAR(100) NOT NULL,
        residential_zone VARCHAR(100) NOT NULL,
        profession VARCHAR(191) NULL,
        field VARCHAR(100) NULL,
        membership_no VARCHAR(60) NOT NULL UNIQUE,
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(50) DEFAULT 'Verified',
        bio TEXT NULL,
        avatar_url TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 2. Welfare Claims Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS welfare_claims (
        id INT AUTO_INCREMENT PRIMARY KEY,
        claim_no VARCHAR(60) NOT NULL UNIQUE,
        claimant_name VARCHAR(191) NOT NULL,
        sub_clan VARCHAR(100) NOT NULL,
        residential_zone VARCHAR(100) NOT NULL,
        claim_type VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Under Review',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Contributions Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        receipt_no VARCHAR(60) NOT NULL UNIQUE,
        mpesa_code VARCHAR(60) NOT NULL UNIQUE,
        member_name VARCHAR(191) NOT NULL,
        phone VARCHAR(60) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        purpose VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Welfare Appeals Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS welfare_appeals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        description TEXT NULL,
        goal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        raised_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        family_name VARCHAR(191) NULL,
        location VARCHAR(191) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 5. Events Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        event_date VARCHAR(100) NOT NULL,
        day VARCHAR(10) NULL,
        dow VARCHAR(10) NULL,
        month VARCHAR(10) NULL,
        time VARCHAR(100) NULL,
        venue VARCHAR(191) NOT NULL,
        category VARCHAR(100) NOT NULL,
        entry_fee VARCHAR(100) DEFAULT 'Free',
        attendees VARCHAR(50) DEFAULT '0',
        description TEXT NULL,
        image_url TEXT NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'Upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 5. News & Communiqués Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        category VARCHAR(100) NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        date VARCHAR(100) NOT NULL,
        read_time VARCHAR(50) DEFAULT '3 min read',
        image_url TEXT NULL,
        author VARCHAR(100) DEFAULT 'Mulembe Secretariat',
        status VARCHAR(50) DEFAULT 'Published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Seed news articles if empty
    const [newsCount]: any = await db.execute("SELECT COUNT(*) AS count FROM news_articles");
    if (newsCount?.[0]?.count === 0) {
      await db.execute(`
        INSERT INTO news_articles (title, category, summary, content, date, read_time, image_url, author)
        VALUES
        (
          'Mulembe18 Kenya Executive Committee Elections 2025–2027 Concluded',
          'Announcements',
          'The General Assembly has formally ratified the newly elected governing council representing all 18 Luhya sub-communities across Kenya.',
          'Following transparent voting held across national sub-branches, the Mulembe18 Electoral Board is pleased to announce the ratified leadership council for the 2025–2027 term. The governing priority centers on expanding the emergency medical evacuation fund and youth mentorship.',
          '18 April 2025',
          '3 min read',
          '/images/coastal-portal.png',
          'Secretariat Desk'
        ),
        (
          'Official Program Released for Annual Luhya Cultural Festival at Mama Ngina',
          'Culture & Festivals',
          'Over 20 traditional Isukuti drum troupes, legendary bullfighting storytellers, and master chefs prepare for Kenya premier cultural spectacle.',
          'The Organizing Committee for the Annual Mulembe Luhya Cultural Day has officially unveiled the schedule of events at Mama Ngina Waterfront Park. Highlights include an inter-clan traditional dance showcase and authentic culinary exhibitions featuring Ingokho and Obusuma bwo Bule.',
          '14 April 2025',
          '4 min read',
          '/images/events-cultural.png',
          'Cultural Committee'
        ),
        (
          'Consolidated Welfare Reserve Surpasses KES 840,000 Milestone with 100% Audit',
          'Welfare & Drives',
          'Independent audit confirms highest solvency ratio in association history, guaranteeing 24-hour bereavement repatriation disbursements.',
          'Treasury Secretary Grace Achieng presented the Q1 2025 audited financial statement to the Elders Council, demonstrating 100% reconciliation across M-Pesa Business Till and KCB Bank accounts.',
          '10 April 2025',
          '2 min read',
          '/images/welfare-ledger.png',
          'Treasury Office'
        )
      `);
    }

    // 6. Gallery Items Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gallery_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url TEXT NOT NULL,
        album_url TEXT NULL,
        label VARCHAR(191) NOT NULL,
        category VARCHAR(100) NOT NULL,
        sub_location VARCHAR(191) NULL,
        is_large BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Ensure album_url column exists if table was previously created
    try {
      await db.execute("ALTER TABLE gallery_items ADD COLUMN album_url TEXT NULL;");
    } catch {}

    // Ensure subcounty_admin_zone column exists (for subcounty admin role enforcement)
    try {
      await db.execute("ALTER TABLE members ADD COLUMN subcounty_admin_zone VARCHAR(100) NULL;");
    } catch {}

    // Ensure password_hash column exists (for custom registration flow)
    try {
      await db.execute("ALTER TABLE members ADD COLUMN password_hash VARCHAR(255) NULL;");
    } catch {}

    // Ensure Location & Leadership hierarchy columns exist on members
    try { await db.execute("ALTER TABLE members ADD COLUMN county VARCHAR(100) DEFAULT 'Mombasa';"); } catch {}
    // Migration: Existing members should get 'Mombasa' as their county
    try {
      await db.execute("UPDATE members SET county = 'Mombasa' WHERE county IS NULL OR county = '' OR county = 'undefined';");
    } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN subcounty VARCHAR(100) NULL;"); } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN ward VARCHAR(100) NULL;"); } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN area_id INT NULL;"); } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN area_name VARCHAR(150) NULL;"); } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN county_leader_county VARCHAR(100) NULL;"); } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN subcounty_admin_zone VARCHAR(100) NULL;"); } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN ward_leader_ward VARCHAR(100) NULL;"); } catch {}
    try { await db.execute("ALTER TABLE members ADD COLUMN area_leader_area_id INT NULL;"); } catch {}

    // Counties Table (Official 47 Kenyan Counties - IEBC Delimitation)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS counties (
        id INT PRIMARY KEY,
        code INT NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL UNIQUE,
        capital VARCHAR(100) NULL
      );
    `);

    // Subcounties Table (Official 290 Kenyan Constituencies / Sub-counties)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subcounties (
        id INT PRIMARY KEY,
        code INT NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        county_code INT NOT NULL,
        county_name VARCHAR(100) NOT NULL,
        INDEX idx_county_name (county_name)
      );
    `);

    // Wards Table (Official 1,450 Kenyan Electoral Wards)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wards (
        id INT PRIMARY KEY,
        code INT NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        constituency_code INT NOT NULL,
        county_code INT NOT NULL,
        county_name VARCHAR(100) NOT NULL,
        subcounty_name VARCHAR(100) NOT NULL,
        INDEX idx_subcounty_lookup (county_name, subcounty_name)
      );
    `);

    // Dispatch Logs Table (Comprehensive role-scoped message logs for SMS & Email)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dispatch_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id VARCHAR(64) NOT NULL,
        sender_id INT NOT NULL,
        sender_name VARCHAR(191) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        sender_scope VARCHAR(150) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        recipient_id INT NULL,
        recipient_name VARCHAR(191) NOT NULL,
        recipient_phone VARCHAR(60) NULL,
        recipient_email VARCHAR(191) NULL,
        recipient_scope VARCHAR(150) NULL,
        subject VARCHAR(255) NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Sent',
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sender (sender_id),
        INDEX idx_batch (batch_id),
        INDEX idx_status (status)
      );
    `);

    // Notifications Table (SMS & Email audit ledger)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient VARCHAR(191) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        subject VARCHAR(255) NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Areas Table (Created and managed by Ward Leaders)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS areas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        ward VARCHAR(100) NOT NULL,
        subcounty VARCHAR(100) NOT NULL,
        county VARCHAR(100) DEFAULT 'Mombasa',
        description TEXT NULL,
        contact_info VARCHAR(191) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by_ward_leader_id INT NULL,
        area_leader_member_id INT NULL,
        area_leader_name VARCHAR(191) NULL,
        area_leader_phone VARCHAR(60) NULL,
        area_leader_email VARCHAR(191) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 9. Area Change Logs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS area_change_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        old_area VARCHAR(150) NULL,
        new_area VARCHAR(150) NOT NULL,
        changed_by VARCHAR(191) NULL,
        reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed gallery items if empty
    const [galleryCount]: any = await db.execute("SELECT COUNT(*) AS count FROM gallery_items");
    if (galleryCount?.[0]?.count === 0) {
      await db.execute(`
        INSERT INTO gallery_items (image_url, label, category, sub_location, is_large, sort_order)
        VALUES
        ('/images/events-cultural.png', 'Annual Luhya Cultural Day & Food Expo', 'Cultural Festival', 'Mama Ngina Waterfront, Mombasa', TRUE, 1),
        ('/images/coastal-portal.png', 'Diaspora Elders Council & Welfare Summit', 'Governance', 'Nyali Links Centre', FALSE, 2),
        ('/images/moodboard.png', 'Isukuti Dance Troupes & Bullfighting Lore', 'Heritage', 'Mombasa Beach Grounds', FALSE, 3),
        ('/images/landing-hero.png', 'Coastal Youth Mentorship & Tech Forum', 'Youth & Career', 'TUM Hall, Tudor', FALSE, 4),
        ('/images/mobile-app.png', 'Mulembe18 Community Welfare Drive', 'Solidarity', 'Likoni & Mtwapa Chapters', FALSE, 5)
      `);
    }

    // 7. Leadership Members Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leadership_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        role VARCHAR(191) NOT NULL,
        clan VARCHAR(100) NOT NULL,
        phone VARCHAR(60) NULL,
        email VARCHAR(191) NULL,
        bio TEXT NULL,
        avatar_url TEXT NULL,
        sort_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Seed leadership members if empty
    const [leadershipCount]: any = await db.execute("SELECT COUNT(*) AS count FROM leadership_members");
    if (leadershipCount?.[0]?.count === 0) {
      await db.execute(`
        INSERT INTO leadership_members (name, role, clan, sort_order)
        VALUES
        ('Daniel Okoth', 'Chairperson', 'Bukusu', 1),
        ('Mary Wanjiku', 'Vice Chairperson', 'Maragoli', 2),
        ('Peter Kamau', 'Secretary General', 'Tiriki', 3),
        ('Grace Achieng', 'Treasurer', 'Samia', 4),
        ('James Ochieng', 'Organizing Sec.', 'Wanga', 5),
        ('Rose Nandwa', 'Welfare Officer', 'Marachi', 6)
      `);
    }

    // 10. Seed Official Kenya Counties, Sub-Counties and Wards (IEBC delimitation)
    try {
      const [subRows]: any = await db.execute("SELECT COUNT(*) AS count FROM subcounties");
      if (subRows?.[0]?.count === 0) {
        console.log("[TiDB / MySQL] Seeding official Kenya 47 Counties, 290 Subcounties, and 1,450 Wards...");
        const countyRows: any[] = [];
        const subcountyRows: any[] = [];
        const wardRows: any[] = [];
        let subGlobalId = 1;
        let wardGlobalId = 1;

        for (const c of kenyaHierarchyData as any[]) {
          countyRows.push([c.code, c.name]);
          for (const s of (c.subcounties || [])) {
            const scId = subGlobalId++;
            subcountyRows.push([scId, s.code, s.name, c.code, c.name]);
            for (const w of (s.wards || [])) {
              const wId = wardGlobalId++;
              const wardName = typeof w === "string" ? w : w.name;
              const wardCode = typeof w === "string" ? wId : (w.code || wId);
              wardRows.push([wId, scId, wardName, s.code, c.code, c.name, s.name]);
            }
          }
        }

        for (let i = 0; i < subcountyRows.length; i += 100) {
          const chunk = subcountyRows.slice(i, i + 100);
          const ph = chunk.map(() => "(?, ?, ?, ?, ?)").join(", ");
          await db.execute(`INSERT IGNORE INTO subcounties (id, code, name, county_code, county_name) VALUES ${ph}`, chunk.flat());
        }

        for (let i = 0; i < wardRows.length; i += 200) {
          const chunk = wardRows.slice(i, i + 200);
          const ph = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
          await db.execute(
            `INSERT IGNORE INTO wards (id, sub_county_id, name, constituency_code, county_code, county_name, subcounty_name) VALUES ${ph}`,
            chunk.flat()
          );
        }
        console.log("[TiDB / MySQL] Successfully seeded all official Kenya counties, subcounties, and wards.");
      }
    } catch (seedErr: any) {
      console.warn("[TiDB / MySQL] Locations seeding notice:", seedErr?.message);
    }

    console.log("[TiDB / MySQL] Schema initialized successfully with all dynamic tables.");
    return { success: true };
  } catch (err: any) {
    console.warn("[TiDB / MySQL] Schema initialization deferred:", err?.message || err);
    return { success: false, error: err?.message };
  }
}
