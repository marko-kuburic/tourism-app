# ---- builder ----
    FROM maven:3.9-eclipse-temurin-17 AS builder
    WORKDIR /app
    
    # >>> Eksplicitno biramo POM koji se kopira (default: pom.xml u build contextu)
    ARG POM_PATH=pom.xml
    COPY ${POM_PATH} ./pom.xml
    
    # Ispiši i proveri da POM stvarno sadrži com.mysql:mysql-connector-j
    RUN echo "=== POM PREVIEW (first 120 lines) ===" && sed -n '1,120p' pom.xml && echo "=== END ===" \
     && grep -q "<groupId>com.mysql</groupId>" pom.xml || (echo "❌ POM nije com.mysql — proveri POM_PATH!" && exit 1)
    
    RUN mvn -q -e -DskipTests dependency:go-offline
    COPY src ./src
    RUN mvn -q -DskipTests package
    
    # ---- runtime ----
    FROM eclipse-temurin:17-jre
    WORKDIR /app
    COPY --from=builder /app/target/*.jar app.jar
    EXPOSE 8083
    ENTRYPOINT ["java", "-jar", "app.jar"]
    