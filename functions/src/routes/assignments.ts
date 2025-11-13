// functions/src/routes/assignments.ts - Assignments API Routes
import { type Response, Router } from "express";
import * as admin from "firebase-admin";
import { type AuthenticatedRequest, requireAdmin, verifyToken } from "../middleware/auth";

const router = Router();

// Get all assignments (with role-based filtering)
router.get("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const { classId, isActive } = req.query;

    let query: any = admin.firestore().collection("assignments");

    // Role-based filtering
    if (role === "student") {
      // Students see assignments for classes they're enrolled in
      if (!req.user?.userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const userDoc = await admin.firestore().collection("users").doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds = userData?.classIds || [];

      if (classIds.length === 0) {
        return res.json([]);
      }

      query = query.where("classId", "in", classIds);
    } else if (role === "teacher") {
      // Teachers see assignments for classes they teach
      const teacherClasses = await admin
        .firestore()
        .collection("classes")
        .where("teacherId", "==", req.user?.userId)
        .get();

      const classIds = teacherClasses.docs.map((doc) => doc.id);

      if (classIds.length === 0) {
        return res.json([]);
      }

      query = query.where("classId", "in", classIds);
    }
    // Admin and staff see all assignments

    // Add filters if provided
    if (classId) {
      query = query.where("classId", "==", classId);
    }

    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive === "true");
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const assignments = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${assignments.length} assignments for role: ${role}`);
    return res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return res.status(500).json({ message: "Failed to fetch assignments" });
  }
});

// Create new assignment
router.post("/", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      classId,
      levelId,
      dueDate,
      maxScore = 100,
      isActive = true,
    } = req.body;

    // Validate that class exists
    const classDoc = await admin.firestore().collection("classes").doc(classId).get();
    if (!classDoc.exists) {
      return res.status(400).json({
        success: false,
        message: "Class not found",
      });
    }

    // Create assignment in Firestore
    const assignmentData = {
      title,
      description,
      classId,
      levelId,
      dueDate: dueDate ? admin.firestore.Timestamp.fromDate(new Date(dueDate)) : null,
      maxScore,
      isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await admin.firestore().collection("assignments").add(assignmentData);

    console.log(`Created assignment: ${docRef.id}`);
    return res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Assignment created successfully",
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create assignment",
    });
  }
});

// Get assignment by ID
router.get("/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.user!;

    const doc = await admin.firestore().collection("assignments").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const assignmentData = doc.data()!;

    // Check if user has access to this assignment
    if (role === "student") {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const userDoc = await admin.firestore().collection("users").doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds = userData?.classIds || [];

      if (!classIds.includes(assignmentData.classId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (role === "teacher") {
      const classDoc = await admin
        .firestore()
        .collection("classes")
        .doc(assignmentData.classId)
        .get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user?.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.json({ id: doc.id, ...assignmentData });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return res.status(500).json({ message: "Failed to fetch assignment" });
  }
});

// Update assignment
router.put("/:id", verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdAt;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Convert dueDate to timestamp if provided
    if (updateData.dueDate) {
      updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(updateData.dueDate));
    }

    await admin.firestore().collection("assignments").doc(id).update(updateData);

    return res.json({ success: true, message: "Assignment updated successfully" });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return res.status(500).json({ message: "Failed to update assignment" });
  }
});

// Delete assignment
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if assignment has submissions
      const submissions = await admin
        .firestore()
        .collection("submissions")
        .where("assignmentId", "==", id)
        .limit(1)
        .get();

      if (!submissions.empty) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete assignment that has submissions",
        });
      }

      await admin.firestore().collection("assignments").doc(id).delete();

      return res.json({ success: true, message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      return res.status(500).json({ message: "Failed to delete assignment" });
    }
  },
);

// Get assignments for a specific class
router.get("/class/:classId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { role } = req.user!;
    const { isActive } = req.query;

    // Check if user has access to this class
    if (role === "student") {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const userDoc = await admin.firestore().collection("users").doc(req.user.userId).get();
      const userData = userDoc.data();
      const classIds = userData?.classIds || [];

      if (!classIds.includes(classId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (role === "teacher") {
      const classDoc = await admin.firestore().collection("classes").doc(classId).get();
      if (!classDoc.exists || classDoc.data()?.teacherId !== req.user?.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    let query: any = admin.firestore().collection("assignments").where("classId", "==", classId);

    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive === "true");
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const assignments = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json(assignments);
  } catch (error) {
    console.error("Error fetching class assignments:", error);
    return res.status(500).json({ message: "Failed to fetch class assignments" });
  }
});

export { router as assignmentsRouter };
