# ---------- builder ----------
  FROM maven:3.9-eclipse-temurin-17 AS builder
  WORKDIR /app
  
  COPY backend/tour/pom.xml ./pom.xml
  COPY proto ./proto
  COPY backend/tour/src ./src
  
  # -U da povuče sve artifakte (protoc, plugin), skipTests ok
  RUN mvn -U -q -DskipTests clean package
  
  # ---------- runtime ----------
  FROM eclipse-temurin:17-jre
  WORKDIR /app
  COPY --from=builder /app/target/*.jar /app/app.jar
  EXPOSE 8084 9094
  CMD ["java", "-jar", "/app/app.jar"]
  