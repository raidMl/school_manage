const express = require('express');

const usersRoutes = require('./users.routes');
const contactInfosRoutes = require('./contactInfos.routes');
const schoolsRoutes = require('./schools.routes');
const teachersRoutes = require('./teachers.routes');
const studentsRoutes = require('./students.routes');
const classroomsRoutes = require('./classrooms.routes');
const formationsRoutes = require('./formations.routes');
const groupsRoutes = require('./groups.routes');
const studentGroupsRoutes = require('./studentGroups.routes');
const schoolUsersRoutes = require('./schoolUsers.routes');
const userContactInfosRoutes = require('./userContactInfos.routes');
const studentRegistrationsRoutes = require('./studentRegistrations.routes');
const authRoutes = require('./auth.routes');
const schoolSetupRoutes = require('./schoolSetup.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/school-setup', schoolSetupRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/contact-infos', contactInfosRoutes);
router.use('/schools', schoolsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/students', studentsRoutes);
router.use('/classrooms', classroomsRoutes);
router.use('/formations', formationsRoutes);
router.use('/groups', groupsRoutes);
router.use('/student-groups', studentGroupsRoutes);
router.use('/school-users', schoolUsersRoutes);
router.use('/user-contact-infos', userContactInfosRoutes);
router.use('/student-registrations', studentRegistrationsRoutes);

module.exports = router;