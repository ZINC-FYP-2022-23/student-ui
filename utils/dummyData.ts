import { AppealStatus, AppealAttempt, DisplayMessageType, ChangeLog, ChangeLogTypes } from "@/types/appeal";

// TODO(BRYAN): Remove the dummy data and replace with GraphQL codes
//The followings is dummy data for the student UI.

export const numAppealsLeft: number = 1;

export const appealStatus: AppealStatus = AppealStatus.Accept;

export const appeal: AppealAttempt | null = {
  id: 1,
  assignmentConfigAndUserId: 999,
  createdAt: "2022-12-20",
  latestStatus: AppealStatus.Reject,
  updatedAt: "2022-12-21",
};

export const messageList: DisplayMessageType[] = [
  {
    id: 1,
    name: "Lo Kwok Yan Bryan",
    type: "Student",
    time: "14 Nov 2022, 18:11",
    content: "Hi TA, I want to submit a grade appeal.",
  },
  {
    id: 2,
    name: "Gilbert Chan",
    type: "Teaching Assistant",
    time: "15 Nov 2022, 20:59",
    content: "Dear Bryan, Nice to Meet You!",
  },
  {
    id: 3,
    name: "Lo Kwok Yan Bryan",
    type: "Student",
    time: "14 Nov 2022, 18:11",
    content: "Hi TA, I want to submit a grade appeal.",
  },
  {
    id: 4,
    name: "Gilbert Chan",
    type: "Teaching Assistant",
    time: "15 Nov 2022, 20:59",
    content: "Okie, chekcing!",
  },
  {
    id: 5,
    name: "Lo Kwok Yan Bryan",
    type: "Student",
    time: "14 Nov 2022, 18:11",
    content: "Thank you.",
  },
  {
    id: 6,
    name: "Gilbert Chan",
    type: "Teaching Assistant",
    time: "15 Nov 2022, 20:59",
    content: "Still in process!",
  },
];

export const appealAttempts: AppealAttempt[] = [
  {
    id: 1001,
    assignmentConfigAndUserId: 999,
    createdAt: "2022-11-13",
    latestStatus: AppealStatus.Reject,
    updatedAt: "2022-11-14",
  },
  {
    id: 1002,
    assignmentConfigAndUserId: 999,
    createdAt: "2022-11-15",
    latestStatus: AppealStatus.Accept,
    updatedAt: "2022-11-16",
  },
];

export const changeLogList: ChangeLog[] = [
  {
    id: 2001,
    createdAt: "2022-11-14",
    type: ChangeLogTypes.APPEAL_STATUS,
    originalState: "[{'status':PENDING}]",
    updatedState: "[{'status':REJECTED}]",
    initiatedBy: 2,
  },
  {
    id: 2002,
    createdAt: "2022-11-15",
    type: ChangeLogTypes.APPEAL_STATUS,
    originalState: "[{'status':REJECTED}]",
    updatedState: "[{'status':ACCEPTED}]",
    initiatedBy: 2,
  },
  {
    id: 2003,
    createdAt: "2022-11-16",
    type: ChangeLogTypes.SCORE,
    originalState: "[{'score':80}]",
    updatedState: "[{'score':100}]",
    initiatedBy: 2,
  },
  {
    id: 2004,
    createdAt: "2022-11-17",
    type: ChangeLogTypes.SUBMISSION,
    originalState: "[{'submission':'old'}]",
    updatedState: "[{'submission':'new'}]",
    initiatedBy: 2,
  },
];

/**
 * Dummy data for diff-ing the original submission and the new appeal submission.
 */
export const multiFileDiff = `
diff --git a/old/main.cpp b/new/main.cpp
index 5bdc00b..6a8f136 100644
--- a/old/main.cpp
+++ b/new/main.cpp
@@ -4,15 +4,12 @@ using namespace std;
 
 #include "sum.h"
 
-// Usually TA writes their own main.cpp file
-// while student submits sums.cpp for the class implementation
-
 int main(int argc, char* argv[])
 {
   int x = atoi(argv[1]);
-  int y = atoi(argv[2]);
+  int z = atoi(argv[2]);
 
-  TwoSum* twoSum = new TwoSum(x, y);
+  TwoSum* twoSum = new TwoSum(x, z);
   cout << twoSum->add() << endl;
   return 0;
 }
diff --git a/old/sum.cpp b/new/sum.cpp
index b04092d..11ad3bc 100644
--- a/old/sum.cpp
+++ b/new/sum.cpp
@@ -1,5 +1,5 @@
 #include "sum.h"
-using namespace std;
+#include <iostream>
 
 TwoSum::TwoSum(int x, int y) {
   first_num = x;
@@ -7,6 +7,11 @@ TwoSum::TwoSum(int x, int y) {
 }
 
 int TwoSum::add() {
-  return first_num + second_num;
+  return first_num - second_num;
 }
 
+int main() {
+  TwoSum sum(1, 2);
+  std::cout << sum.add() << std::endl;
+  return 0;
+}
`;
