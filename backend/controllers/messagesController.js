import supabase from "../config/supabaseClient.js";

export const sendMessage = async (req, res) => {
  try {
    const { match_id, sender_id, content } = req.body;

    //validating input

    if (!match_id || !sender_id || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    //checking if match exists and user belongs to it

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("match_id", match_id)
      .maybeSingle();

    if (matchError) throw matchError;

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const isParticipant =
      match.user1_id === sender_id || match.user2_id === sender_id;

    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Not allowed to message this chat" });
    }

    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert([
        {
          match_id,
          sender_id,
          content,
        },
      ])
      .select()
      .single();

    if (msgError) throw msgError;

    const formattedMessage = {
      id: message.message_id,
      match_id: message.match_id,
      sender_id: message.sender_id,
      content: message.content,
      createdAt: message.created_at,
    };

    return res.status(200).json(formattedMessage);
  } catch (err) {
    console.error("Send message error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { match_id } = req.params;

    if (!match_id) {
      return res.status(400).json({ error: "Missing match ID" });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", match_id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const formatted = data.map((m) => ({
      id: m.message_id,
      match_id: m.match_id,
      sender_id: m.sender_id,
      content: m.content,
      createdAt: new Date(m.created_at).toISOString(),
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("Fetch messages error: ", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ error: "Missing user id" });
    }

    // 1. Get all matches involving user
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${userid},user2_id.eq.${userid}`);

    if (matchError) throw matchError;

    // 2. Build enriched conversations
    const conversations = await Promise.all(
      matches.map(async (match) => {
        const otherUserId =
          match.user1_id === userid ? match.user2_id : match.user1_id;

        // ── last message ──
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("*")
          .eq("match_id", match.match_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // ── other user ──
        const { data: otherUser } = await supabase
          .from("users")
          .select("userid, name, avatarUrl, devType, city")
          .eq("userid", otherUserId)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", match.match_id)
          .neq("sender_id", userid) // messages NOT sent by you
          .eq("read", false); // only unread

        // ── return ──
        return {
          conversationId: match.match_id,
          otherUser,
          lastMessage: lastMessage?.content || "",
          lastMessageAt: lastMessage?.created_at
            ? new Date(lastMessage.created_at).toISOString()
            : null,
          unread: unreadCount || 0,
        };
      }),
    );

    return res.status(200).json(conversations);
  } catch (err) {
    console.error("Get conversations error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({
        error: "conversationId and userId are required",
        received: req.body,
      });
    }

    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("match_id", conversationId)
      .neq("sender_id", userId);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ error: err.message });
  }
};
