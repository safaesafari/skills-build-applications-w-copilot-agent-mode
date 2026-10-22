import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const values = typeof input === 'object' && input !== null && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const { userId, teamId, type, minutes } = values;

  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || type.trim().length === 0 ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('A valid userId, teamId, type, and positive minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('The referenced user or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const values = typeof input === 'object' && input !== null && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const { name, mascot } = values;
  const members = values.members ?? [];

  if (
    typeof name !== 'string' || name.trim().length === 0 ||
    typeof mascot !== 'string' || mascot.trim().length === 0 ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))
  ) {
    throw Object.assign(new Error('A team name, mascot, and valid member IDs are required'), { status: 400 });
  }

  const memberIds = members.map((member) => new Types.ObjectId(member as string));
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id');
  if (existingMembers.length !== memberIds.length) {
    throw Object.assign(new Error('One or more team members do not exist'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map(({ teamName, totalPoints }, index) => ({ teamName, totalPoints, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [recentActivity, goalWorkouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find({ focus: user.fitnessGoal }).lean(),
  ]);

  if (goalWorkouts.length > 0) {
    const reason = recentActivity
      ? `Recommended for your ${user.fitnessGoal} goal and recent ${recentActivity.type} activity.`
      : `Recommended for your ${user.fitnessGoal} goal.`;
    return goalWorkouts.map((workout) => ({ ...workout, reason }));
  }

  if (!recentActivity) return [];

  const activityWorkouts = await Workout.find({ focus: recentActivity.type }).lean();
  const reason = `Recommended based on your recent ${recentActivity.type} activity.`;
  return activityWorkouts.map((workout) => ({ ...workout, reason }));
}

export { User };
