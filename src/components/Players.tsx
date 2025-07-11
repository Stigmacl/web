@@ .. @@
 import React, { useState } from 'react';
-import { Users, Search, Filter, MapPin, Calendar, Star, Shield, Crown, UserPlus, MessageCircle, Trophy, Swords, Award, Target } from 'lucide-react';
+import { Users, Search, Filter, MapPin, Calendar, Star, Shield, Crown, UserPlus, MessageCircle, Trophy, Swords, Award, Target } from 'lucide-react';
 import { useAuth } from '../contexts/AuthContext';
 import UserProfile from './UserProfile';
+import Ranking from './Ranking';
 import ClanManager from './ClanManager';
 import TournamentManager from './TournamentManager';

-type PlayersSection = 'players' | 'clans' | 'tournaments';
+type PlayersSection = 'players' | 'ranking' | 'clans' | 'tournaments';