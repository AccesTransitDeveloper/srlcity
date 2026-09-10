import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  profilesTable,
  postsTable,
  commentsTable,
  likesTable,
  groupsTable,
  groupMembersTable,
  eventsTable,
  eventParticipantsTable,
  chatThreadsTable,
  messagesTable,
} from "@workspace/db/schema";

const router: IRouter = Router();

router.post("/seed", async (_req, res) => {
  try {
    await db.delete(messagesTable);
    await db.delete(chatThreadsTable);
    await db.delete(likesTable);
    await db.delete(commentsTable);
    await db.delete(postsTable);
    await db.delete(groupMembersTable);
    await db.delete(groupsTable);
    await db.delete(eventParticipantsTable);
    await db.delete(eventsTable);
    await db.delete(profilesTable);

    const profiles = await db.insert(profilesTable).values([
      { name: "Али Мамадшоев", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali", institution: "ХГУИТ", city: "Мургаб", bio: "Студент IT. Люблю горы и код.", badge: "leader", rating: 520 },
      { name: "Фатима Курбанова", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima", institution: "ТНУ", city: "Хорог", bio: "Изучаю медицину. Волонтёр.", badge: "active", rating: 380 },
      { name: "Карим Шодиев", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karim", institution: "ХГУИТ", city: "Ишкашим", bio: "Футбол, музыка, программирование.", rating: 290 },
      { name: "Зарина Акбарова", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zarina", institution: "ТНУ", city: "Мургаб", bio: "Будущий учитель. Пишу стихи.", badge: "active", rating: 350 },
      { name: "Рустам Назаров", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rustam", institution: "КТУТ", city: "Хорог", bio: "Инженер в душе.", rating: 200 },
    ]).returning();

    const [ali, fatima, karim, zarina, rustam] = profiles;

    const posts = await db.insert(postsTable).values([
      { authorId: ali.id, content: "Кто-нибудь идёт на хакатон в Хороге на следующей неделе? Давайте соберём команду от Сарыкола! 🚀" },
      { authorId: fatima.id, content: "Сегодня провели медицинский осмотр для школьников в Мургабе. Спасибо всем волонтёрам! ❤️", imageUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop" },
      { authorId: karim.id, content: "Новый трек готов! Записал кавер на памирскую народную песню в современной обработке 🎵" },
      { authorId: zarina.id, content: "Осень в горах Памира — это что-то невероятное. Делюсь фото с сегодняшней прогулки 🏔️", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop" },
    ]).returning();

    await db.insert(commentsTable).values([
      { postId: posts[0].id, authorId: fatima.id, text: "Я иду! Давай команду собирать 🙌" },
      { postId: posts[0].id, authorId: karim.id, text: "Тоже хочу! Запишите меня" },
      { postId: posts[1].id, authorId: zarina.id, text: "Молодцы! Горжусь нашим сообществом" },
      { postId: posts[3].id, authorId: rustam.id, text: "Красотища! Где это снято?" },
    ]);

    await db.insert(likesTable).values([
      { postId: posts[1].id, userId: ali.id },
      { postId: posts[3].id, userId: ali.id },
      { postId: posts[3].id, userId: fatima.id },
      { postId: posts[0].id, userId: karim.id },
    ]);

    const groups = await db.insert(groupsTable).values([
      { name: "IT Сарыкол", description: "Программирование, технологии и стартапы", memberCount: 0, coverUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop", createdBy: ali.id },
      { name: "Спорт и Здоровье", description: "Футбол, волейбол, походы в горы", memberCount: 0, coverUrl: "https://images.unsplash.com/photo-1461896836934-bd45ba8fcfdd?w=400&h=200&fit=crop", createdBy: rustam.id },
      { name: "Музыка Памира", description: "Традиционная и современная музыка", memberCount: 0, coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=200&fit=crop", createdBy: karim.id },
      { name: "Волонтёры Мургаба", description: "Помогаем сообществу вместе", memberCount: 0, coverUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=200&fit=crop", createdBy: fatima.id },
      { name: "Наука и Образование", description: "Подготовка к экзаменам, учебные материалы", memberCount: 0, coverUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=200&fit=crop", createdBy: zarina.id },
    ]).returning();

    await db.insert(groupMembersTable).values([
      { groupId: groups[0].id, userId: ali.id },
      { groupId: groups[0].id, userId: karim.id },
      { groupId: groups[0].id, userId: rustam.id },
      { groupId: groups[2].id, userId: karim.id },
      { groupId: groups[2].id, userId: ali.id },
      { groupId: groups[3].id, userId: fatima.id },
      { groupId: groups[3].id, userId: zarina.id },
      { groupId: groups[4].id, userId: zarina.id },
      { groupId: groups[4].id, userId: fatima.id },
      { groupId: groups[1].id, userId: rustam.id },
    ]);

    await db.execute(`
      UPDATE groups SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = groups.id)
    `);

    const events = await db.insert(eventsTable).values([
      { title: "Хакатон Хорог 2026", description: "48-часовой хакатон для студентов Памира", date: "25 марта 2026", location: "Хорог, ХГУИТ", coverUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=200&fit=crop", createdBy: ali.id },
      { title: "Наурӯз-fest", description: "Празднование Навруза с музыкой и едой", date: "21 марта 2026", location: "Мургаб, Центр", coverUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=200&fit=crop", createdBy: fatima.id },
      { title: "Поход на озеро Зоркуль", description: "Однодневный поход с фотосессией", date: "5 апреля 2026", location: "Мургаб", coverUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=200&fit=crop", createdBy: zarina.id },
    ]).returning();

    await db.insert(eventParticipantsTable).values([
      { eventId: events[1].id, userId: ali.id },
      { eventId: events[1].id, userId: fatima.id },
      { eventId: events[1].id, userId: karim.id },
      { eventId: events[0].id, userId: ali.id },
      { eventId: events[0].id, userId: karim.id },
      { eventId: events[2].id, userId: zarina.id },
    ]);

    await db.execute(`
      UPDATE events SET participant_count = (SELECT COUNT(*) FROM event_participants WHERE event_id = events.id)
    `);

    const thread1 = await db.insert(chatThreadsTable).values({ user1Id: ali.id, user2Id: fatima.id, lastMessage: "Да, завтра в 10 утра встречаемся!" }).returning();
    const thread2 = await db.insert(chatThreadsTable).values({ user1Id: ali.id, user2Id: karim.id, lastMessage: "Послушай трек, отправил ссылку" }).returning();
    const thread3 = await db.insert(chatThreadsTable).values({ user1Id: ali.id, user2Id: zarina.id, lastMessage: "Спасибо за помощь с проектом 🙏" }).returning();

    await db.insert(messagesTable).values([
      { threadId: thread1[0].id, senderId: fatima.id, text: "Привет! Ты идёшь на хакатон?", read: true },
      { threadId: thread1[0].id, senderId: ali.id, text: "Да, конечно! Уже зарегистрировался", read: true },
      { threadId: thread1[0].id, senderId: fatima.id, text: "Да, завтра в 10 утра встречаемся!", read: false },
      { threadId: thread2[0].id, senderId: karim.id, text: "Послушай трек, отправил ссылку", read: true },
      { threadId: thread3[0].id, senderId: zarina.id, text: "Спасибо за помощь с проектом 🙏", read: false },
    ]);

    res.json({ status: "seeded successfully" });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
